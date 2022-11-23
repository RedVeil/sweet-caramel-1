export interface NotificationProps {
  id: number;
  visible: boolean;
  type: "success" | "error" | "waiting";
  title: string;
  isFlash?: boolean;
  content: string | JSX.Element;
  backdrop?: boolean;
}
