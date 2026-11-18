import type { ComponentProps, RefObject } from "react";

import type { AsciiHandle } from "@/lib/ascii/frame";
import type { AsciiLook } from "@/lib/ascii/look";

export interface AsciiSceneProps
  extends AsciiLook, Omit<ComponentProps<"div">, "children"> {
  
  cell?: number;
  
  speed?: number;
  
  animate?: boolean;
  
  fps?: number;
  
  stillTime?: number;
  
  interactive?: boolean;
  
  handle?: RefObject<AsciiHandle | null>;
}
