export default function AboutUs() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold">About Us</h1>
      <div className="mt-6 section-card">
        <h2 className="text-lg font-semibold">Data Factory — Delivery Team</h2>
        <p className="mt-3 text-slate leading-relaxed">
          We are the delivery arm of the Data Factory, responsible for orchestrating the end-to-end delivery
          of data products across the organization. Our mission is to ensure quality, predictability, and
          transparency in every engagement.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-mist p-4 text-center">
            <p className="text-2xl font-bold text-accent">Factory Central</p>
            <p className="mt-1 text-xs text-slate">One-stop shop for delivery</p>
          </div>
          <div className="rounded-xl bg-mist p-4 text-center">
            <p className="text-2xl font-bold text-ink">Delivery Suite</p>
            <p className="mt-1 text-xs text-slate">Integrated service portfolio</p>
          </div>
          <div className="rounded-xl bg-mist p-4 text-center">
            <p className="text-2xl font-bold text-ink">Agentic Workflows</p>
            <p className="mt-1 text-xs text-slate">AI-powered data production</p>
          </div>
        </div>
      </div>
    </div>
  )
}
