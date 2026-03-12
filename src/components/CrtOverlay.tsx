export default function CrtOverlay() {
  return (
    <div aria-hidden="true" className="crt-root">
      <div className="crt-scanlines" />
      <div className="crt-flicker" />
      <div className="crt-vignette" />
    </div>
  )
}
