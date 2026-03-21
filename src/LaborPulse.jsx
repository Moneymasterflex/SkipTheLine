export default function LaborPulse() {
  return (
    <iframe
      src="/labor-pulse/index.html"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        border: 'none',
        zIndex: 9999
      }}
      title="SkipTheLine Labor Pulse Map"
    />
  );
}
