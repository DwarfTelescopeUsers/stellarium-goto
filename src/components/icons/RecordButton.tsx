import styles from "@/components/icons/RecordButton.module.css";

type PropType = {
  onClick: () => void;
};
export default function RecordingButton(props: PropType) {
  const { onClick } = props;
  return (
    <svg
      onClick={onClick}
      className={styles.icon}
      height="100%"
      version="1.1"
      viewBox="0 0 64 64"
      width="100%"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 32C2 15.4317 15.4317 2 32 2C48.5683 2 62 15.4317 62 32C62 48.5683 48.5683 62 32 62C15.4317 62 2 48.5683 2 32Z"
        fill="none"
        opacity="1"
        stroke="currentColor"
        strokeLinecap="butt"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M21 32C21 25.9249 25.9249 21 32 21C38.0751 21 43 25.9249 43 32C43 38.0751 38.0751 43 32 43C25.9249 43 21 38.0751 21 32Z"
        fill="currentColor"
        fill-rule="nonzero"
        opacity="1"
        stroke="currentColor"
        strokeLinecap="butt"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
