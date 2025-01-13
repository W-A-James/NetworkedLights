export default function Header({ title }: { title: string }) {
  return (
    <header className="d-flex flex-wrap justify-content-center py-3 mb-4 border-bottom">
      <span className="fs-4">{title}</span>
    </header>
  )
}
