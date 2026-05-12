from __future__ import annotations

import os
from io import BytesIO
from decimal import Decimal

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.models.asset_loan_voucher import AssetLoanVoucher
from app.models.supply_export_voucher import SupplyExportVoucher
from app.models.warranty_ticket import WarrantyTicket


def _try_register_unicode_font() -> str:
    font_candidates = [
        r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\tahoma.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
    ]

    for path in font_candidates:
        if os.path.exists(path):
            pdfmetrics.registerFont(TTFont("AppUnicodeFont", path))
            return "AppUnicodeFont"

    return "Helvetica"


def _money(value: Decimal | int | float | None) -> str:
    if value is None:
        return "0.00"
    return f"{Decimal(str(value)):,.2f}"


def _text(value: object | None) -> str:
    if value is None:
        return ""
    return str(value)


def _build_doc(story: list, pagesize=A4) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=pagesize,
        rightMargin=15 * mm,
        leftMargin=15 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
    )
    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


def generate_supply_export_pdf(voucher: SupplyExportVoucher) -> bytes:
    font_name = _try_register_unicode_font()

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "TitleVN",
        parent=styles["Title"],
        fontName=font_name,
        fontSize=16,
        leading=20,
        alignment=1,
    )
    normal_style = ParagraphStyle(
        "NormalVN",
        parent=styles["Normal"],
        fontName=font_name,
        fontSize=10,
        leading=14,
    )
    small_style = ParagraphStyle(
        "SmallVN",
        parent=styles["Normal"],
        fontName=font_name,
        fontSize=9,
        leading=12,
    )

    story = []

    story.append(Paragraph("HOC VIEN CONG NGHE BUU CHINH VIEN THONG", normal_style))
    story.append(Paragraph("PHIEU XUAT VAT TU", title_style))
    story.append(Spacer(1, 6))

    recipient_department = (
        voucher.recipient_department.name
        if voucher.recipient_department is not None
        else "Khong xac dinh"
    )
    created_by = (
        voucher.created_by_user.full_name
        if voucher.created_by_user is not None
        else "Khong xac dinh"
    )
    approved_by = (
        voucher.approved_by_user.full_name
        if voucher.approved_by_user is not None
        else ""
    )

    info_lines = [
        f"So phieu: {voucher.voucher_code}",
        f"Ngay xuat: {voucher.export_date.strftime('%d/%m/%Y %H:%M')}",
        f"Phong ban nhan: {recipient_department}",
        f"Nguoi lap: {created_by}",
        f"Ly do xuat: {voucher.reason or ''}",
        f"Trang thai: {voucher.status.value}",
    ]
    if approved_by:
        info_lines.append(f"Nguoi duyet: {approved_by}")

    for line in info_lines:
        story.append(Paragraph(line, normal_style))

    story.append(Spacer(1, 8))

    table_data = [[
        Paragraph("STT", small_style),
        Paragraph("Ma VT", small_style),
        Paragraph("Ten vat tu", small_style),
        Paragraph("Don vi", small_style),
        Paragraph("So luong", small_style),
        Paragraph("Don gia", small_style),
        Paragraph("Thanh tien", small_style),
        Paragraph("Ghi chu", small_style),
    ]]

    for index, item in enumerate(voucher.items, start=1):
        table_data.append([
            Paragraph(str(index), small_style),
            Paragraph(_text(item.supply_code_snapshot), small_style),
            Paragraph(_text(item.supply_name_snapshot), small_style),
            Paragraph(_text(item.unit_snapshot), small_style),
            Paragraph(_money(item.quantity), small_style),
            Paragraph(_money(item.unit_price), small_style),
            Paragraph(_money(item.line_total), small_style),
            Paragraph(_text(item.note), small_style),
        ])

    table = Table(
        table_data,
        colWidths=[12 * mm, 22 * mm, 45 * mm, 18 * mm, 22 * mm, 25 * mm, 28 * mm, 25 * mm],
        repeatRows=1,
    )
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("ALIGN", (3, 1), (6, -1), "CENTER"),
        ("FONTNAME", (0, 0), (-1, -1), font_name),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))

    story.append(table)
    story.append(Spacer(1, 8))
    story.append(Paragraph(f"Tong so luong: {_money(voucher.total_quantity)}", normal_style))
    story.append(Paragraph(f"Tong thanh tien: {_money(voucher.total_amount)}", normal_style))
    story.append(Paragraph(f"Ghi chu: {voucher.note or ''}", normal_style))
    story.append(Spacer(1, 24))

    signature_table = Table([
        [
            Paragraph("Nguoi lap phieu<br/><br/><br/>(Ky, ghi ro ho ten)", normal_style),
            Paragraph("Nguoi duyet<br/><br/><br/>(Ky, ghi ro ho ten)", normal_style),
            Paragraph("Don vi nhan<br/><br/><br/>(Ky, ghi ro ho ten)", normal_style),
        ]
    ], colWidths=[60 * mm, 60 * mm, 60 * mm])
    signature_table.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("FONTNAME", (0, 0), (-1, -1), font_name),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
    ]))
    story.append(signature_table)

    return _build_doc(story)


def generate_asset_loan_pdf(voucher: AssetLoanVoucher) -> bytes:
    font_name = _try_register_unicode_font()

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "LoanTitle",
        parent=styles["Title"],
        fontName=font_name,
        fontSize=16,
        leading=20,
        alignment=1,
    )
    normal_style = ParagraphStyle(
        "LoanNormal",
        parent=styles["Normal"],
        fontName=font_name,
        fontSize=10,
        leading=14,
    )
    small_style = ParagraphStyle(
        "LoanSmall",
        parent=styles["Normal"],
        fontName=font_name,
        fontSize=9,
        leading=12,
    )

    borrower_department = (
        voucher.borrower_department.name
        if voucher.borrower_department is not None
        else "Khong xac dinh"
    )
    borrower_user = (
        voucher.borrower_user.full_name
        if voucher.borrower_user is not None
        else "Khong xac dinh"
    )
    approved_by = (
        voucher.approved_by_user.full_name
        if voucher.approved_by_user is not None
        else ""
    )

    story = []
    story.append(Paragraph("HOC VIEN CONG NGHE BUU CHINH VIEN THONG", normal_style))
    story.append(Paragraph("PHIEU MUON TAI SAN", title_style))
    story.append(Spacer(1, 6))

    info_lines = [
        f"So phieu: {voucher.voucher_code}",
        f"Ngay muon: {voucher.loan_date.strftime('%d/%m/%Y') if voucher.loan_date else ''}",
        f"Han tra: {voucher.expected_return_date.strftime('%d/%m/%Y') if voucher.expected_return_date else ''}",
        f"Ngay tra thuc te: {voucher.actual_return_date.strftime('%d/%m/%Y') if voucher.actual_return_date else ''}",
        f"Phong ban muon: {borrower_department}",
        f"Nguoi muon: {borrower_user}",
        f"Muc dich: {voucher.purpose or ''}",
        f"Trang thai: {voucher.status.value}",
    ]
    if approved_by:
        info_lines.append(f"Nguoi duyet: {approved_by}")

    for line in info_lines:
        story.append(Paragraph(line, normal_style))

    story.append(Spacer(1, 8))

    table_data = [[
        Paragraph("STT", small_style),
        Paragraph("Ma TS", small_style),
        Paragraph("Ten tai san", small_style),
        Paragraph("Tinh trang truoc", small_style),
        Paragraph("Tinh trang sau", small_style),
        Paragraph("Ghi chu", small_style),
    ]]

    for index, item in enumerate(voucher.items, start=1):
        table_data.append([
            Paragraph(str(index), small_style),
            Paragraph(_text(item.asset_code_snapshot), small_style),
            Paragraph(_text(item.asset_name_snapshot), small_style),
            Paragraph(_text(item.condition_before_snapshot), small_style),
            Paragraph(_text(item.condition_after_return), small_style),
            Paragraph(_text(item.note), small_style),
        ])

    table = Table(
        table_data,
        colWidths=[12 * mm, 28 * mm, 55 * mm, 35 * mm, 35 * mm, 25 * mm],
        repeatRows=1,
    )
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("FONTNAME", (0, 0), (-1, -1), font_name),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(table)

    story.append(Spacer(1, 10))
    story.append(Paragraph(f"Ghi chu: {voucher.note or ''}", normal_style))
    story.append(Spacer(1, 24))

    signature_table = Table([
        [
            Paragraph("Nguoi lap phieu<br/><br/><br/>(Ky, ghi ro ho ten)", normal_style),
            Paragraph("Nguoi muon<br/><br/><br/>(Ky, ghi ro ho ten)", normal_style),
            Paragraph("Nguoi duyet<br/><br/><br/>(Ky, ghi ro ho ten)", normal_style),
        ]
    ], colWidths=[60 * mm, 60 * mm, 60 * mm])
    signature_table.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("FONTNAME", (0, 0), (-1, -1), font_name),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
    ]))
    story.append(signature_table)

    return _build_doc(story)


def generate_warranty_ticket_pdf(ticket: WarrantyTicket) -> bytes:
    font_name = _try_register_unicode_font()

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "WarrantyTitle",
        parent=styles["Title"],
        fontName=font_name,
        fontSize=16,
        leading=20,
        alignment=1,
    )
    normal_style = ParagraphStyle(
        "WarrantyNormal",
        parent=styles["Normal"],
        fontName=font_name,
        fontSize=10,
        leading=14,
    )
    small_style = ParagraphStyle(
        "WarrantySmall",
        parent=styles["Normal"],
        fontName=font_name,
        fontSize=9,
        leading=12,
    )

    asset_code = ticket.asset.asset_code if getattr(ticket, "asset", None) is not None else ""
    asset_name = ticket.asset.name if getattr(ticket, "asset", None) is not None else ""
    created_by = (
        ticket.created_by_user.full_name
        if getattr(ticket, "created_by_user", None) is not None
        else ""
    )
    handled_by = (
        ticket.handled_by_user.full_name
        if getattr(ticket, "handled_by_user", None) is not None
        else ""
    )

    story = []
    story.append(Paragraph("HOC VIEN CONG NGHE BUU CHINH VIEN THONG", normal_style))
    story.append(Paragraph("PHIEU BAO HANH TAI SAN", title_style))
    story.append(Spacer(1, 6))

    info_lines = [
        f"So phieu: {ticket.warranty_code}",
        f"Ma tai san: {asset_code}",
        f"Ten tai san: {asset_name}",
        f"Nha cung cap/bao hanh: {ticket.vendor_name or ''}",
        f"Thong tin lien he: {ticket.provider_contact or ''}",
        f"Ngay bat dau BH: {ticket.warranty_start_date.strftime('%d/%m/%Y') if ticket.warranty_start_date else ''}",
        f"Ngay ket thuc BH: {ticket.warranty_end_date.strftime('%d/%m/%Y') if ticket.warranty_end_date else ''}",
        f"Ngay gui BH: {ticket.sent_date.strftime('%d/%m/%Y') if ticket.sent_date else ''}",
        f"Ngay hen tra: {ticket.expected_return_date.strftime('%d/%m/%Y') if ticket.expected_return_date else ''}",
        f"Ngay nhan lai: {ticket.received_back_date.strftime('%d/%m/%Y') if ticket.received_back_date else ''}",
        f"Trang thai: {ticket.status.value}",
        f"Nguoi lap: {created_by}",
        f"Nguoi xu ly: {handled_by}",
    ]

    for line in info_lines:
        story.append(Paragraph(line, normal_style))

    story.append(Spacer(1, 8))
    story.append(Paragraph("<b>Mo ta loi:</b>", normal_style))
    story.append(Paragraph(_text(ticket.issue_description), small_style))
    story.append(Spacer(1, 6))
    story.append(Paragraph("<b>Ket qua xu ly:</b>", normal_style))
    story.append(Paragraph(_text(ticket.resolution_note), small_style))
    story.append(Spacer(1, 6))
    story.append(Paragraph(f"Ghi chu: {ticket.note or ''}", normal_style))
    story.append(Spacer(1, 24))

    signature_table = Table([
        [
            Paragraph("Nguoi lap phieu<br/><br/><br/>(Ky, ghi ro ho ten)", normal_style),
            Paragraph("Don vi bao hanh<br/><br/><br/>(Ky, ghi ro ho ten)", normal_style),
            Paragraph("Nguoi nhan lai<br/><br/><br/>(Ky, ghi ro ho ten)", normal_style),
        ]
    ], colWidths=[60 * mm, 60 * mm, 60 * mm])
    signature_table.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("FONTNAME", (0, 0), (-1, -1), font_name),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
    ]))
    story.append(signature_table)

    return _build_doc(story)