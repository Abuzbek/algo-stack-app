import * as React from "react";
import Svg, { Path } from "react-native-svg";

function GoogleIcon(props: any) {
  return (
    <Svg
      aria-label="Google logo"
      width={16}
      height={16}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      {...props}
    >
      <Path d="M0 0h512v512H0" fill="#fff" />
      <Path
        fill="#34a853"
        d="M153 292c30 82 118 95 171 60h62v48a192 192 0 01-296-59"
      />
      <Path
        fill="#4285f4"
        d="M386 400a140 175 0 0053-179H260v74h102q-7 37-38 57"
      />
      <Path fill="#fbbc02" d="M90 341a208 200 0 010-171l63 49q-12 37 0 73" />
      <Path
        fill="#ea4335"
        d="M153 219c22-69 116-109 179-50l55-54c-78-75-230-72-297 55"
      />
    </Svg>
  );
}

export default GoogleIcon;
