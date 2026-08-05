interface Props {
  message: string;
}

export function ErrorBanner({ message }: Props) {
  return <p className="team-error">{message}</p>;
}
