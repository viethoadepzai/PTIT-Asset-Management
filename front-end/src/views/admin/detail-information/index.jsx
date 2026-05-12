/*!
  _   _  ___  ____  ___ ________  _   _   _   _ ___   
 | | | |/ _ \|  _ \|_ _|__  / _ \| \ | | | | | |_ _| 
 | |_| | | | | |_) || |  / / | | |  \| | | | | || | 
 |  _  | |_| |  _ < | | / /| |_| | |\  | | |_| || |
 |_| |_|\___/|_| \_\___/____\___/|_| \_|  \___/|___|
                                                                                                                                                                                                                                                                                                                                       
=========================================================
* Horizon UI - v1.1.0
=========================================================

* Product Page: https://www.horizon-ui.com/
* Copyright 2023 Horizon UI (https://www.horizon-ui.com/)

* Designed and Coded by Simmmple

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/

// Chakra imports
import React, { useState} from "react"
import axios from "axios";


import { Box, SimpleGrid } from "@chakra-ui/react";
import { SearchBar } from 'views/admin/detail-information/components/searchDetail';
import DetailInfoCard from "views/admin/detail-information/components/DetailInfoCard";


export default function Settings() {
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (term) => {
    if (!term.trim()) return; // Bỏ qua nếu term rỗng
    setSearchTerm(term);
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`http://your-backend-url/api/search?query=${encodeURIComponent(term)}`);
      setData(response.data); // Giả sử API trả { title, content }
    } catch (err) {
      setError("Không thể tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };
  // Chakra Color Mode
  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
        <SearchBar
            me="10px"
            borderRadius="30px"
            placeholder="Search with code.."
            onSearch={handleSearch}
            />
        <DetailInfoCard
          data={data}
          loading={loading}
          error={error}
        />
    </Box>
  );
}
