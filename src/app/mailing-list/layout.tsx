export default function MailingListLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        body { display: flex; flex-direction: column; min-height: 100vh; }
        body > main { flex: 1; display: flex; align-items: center; justify-content: center; }
        body > footer { margin-top: 0 !important; }
      `}</style>
      {children}
    </>
  )
}
