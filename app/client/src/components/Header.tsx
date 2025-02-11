import "../css/Header.css";

export default function Header({ title, imgsrc }: { title: string, imgsrc?: string }) {
  const img = imgsrc ?
    <img src={imgsrc} alt="Light Controller logo; A 2d graphic of a red led with a red, green and blue light ray fanning out from the top of the led" /> : undefined;
  return (
    <header className="Header d-flex flex-wrap justify-content-center align-items-center py-3 mb-4 border-bottom">
      {img}
      <span className="fs-4">{title}</span>
    </header>
  )
}
