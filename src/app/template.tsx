export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ animation: "pageIn 0.22s cubic-bezier(0.22,1,0.36,1) both" }}>
      {children}
    </div>
  );
}
