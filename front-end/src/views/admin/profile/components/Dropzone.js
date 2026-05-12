// Chakra imports
import { Button, Flex, Input, useColorModeValue } from "@chakra-ui/react";
// Assets
import React from "react";
import { useDropzone } from "react-dropzone";

function Dropzone(props) {
  const { content, onDrop, accept, multiple = false, disabled = false, ...rest } = props;
  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept,
    multiple,
    disabled,
  });
  const bg = useColorModeValue("gray.100", "navy.700");
  const borderColor = useColorModeValue("secondaryGray.100", "whiteAlpha.100");
  return (
    <Flex
      align='center'
      justify='center'
      bg={bg}
      border='1px dashed'
      borderColor={borderColor}
      borderRadius='16px'
      w='100%'
      h='max-content'
      minH='100%'
      cursor={disabled ? "not-allowed" : "pointer"}
      opacity={disabled ? 0.6 : 1}
      {...getRootProps({ className: "dropzone" })}
      {...rest}>
      <Input variant='main' {...getInputProps()} />
      <Button variant='no-effects' isDisabled={disabled}>{content}</Button>
    </Flex>
  );
}

export default Dropzone;
