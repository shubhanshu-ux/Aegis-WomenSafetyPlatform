/**
 * Premium full-height shell with modern SaaS design.
 */
function PageContainer({ children, nav }) {
  return (
    <main className="min-h-screen relative z-[2]">
      {nav}
      <div className="mx-auto w-full max-w-6xl px-6 pb-16 pt-12 sm:px-8 sm:pb-20 sm:pt-16">
        {children}
      </div>
    </main>
  );
}

export default PageContainer;
