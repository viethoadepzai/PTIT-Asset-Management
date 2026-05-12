// import React from "react";

// // Chakra imports
// import { Flex, useColorModeValue } from "@chakra-ui/react";

// // Custom components
// import { HorizonLogo } from "components/icons/Icons";
// import { HSeparator } from "components/separator/Separator";

// export function SidebarBrand() {
//   //   Chakra color mode
//   let logoColor = useColorModeValue("navy.700", "white");

//   return (
//     <Flex align='center' direction='column'>
//       <HorizonLogo h='26px' w='175px' my='32px' color={logoColor} />
//       <HSeparator mb='20px' />
//     </Flex>
//   );
// }

// export default SidebarBrand;


import React from "react";

// Chakra imports
import { Flex, Image, Text, useColorModeValue } from "@chakra-ui/react";

// Custom components
import { HSeparator } from "components/separator/Separator";

export function SidebarBrand() {
  const textColor = useColorModeValue("navy.700", "white");
  const logoSrc = "/logo-ptit.png";

  return (
    <Flex direction="column">
      <Flex align="center" justify="center" my="32px" gap="10px">
        <Image
          src={logoSrc}
          alt="Logo"
          h="40px"
          objectFit="contain"
        />

        <Text
          fontSize="lg"
          fontWeight="bold"
          color={textColor}
          whiteSpace="nowrap"
        >
          PTIT Asset Management
        </Text>
      </Flex>

      <HSeparator mb="20px" />
    </Flex>
  );
}

export default SidebarBrand;
