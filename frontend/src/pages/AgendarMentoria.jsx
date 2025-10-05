export default function AgendarMentoria() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Agendar Mentoria
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl">
          Em breve você poderá agendar suas sessões de mentoria diretamente por aqui.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <svg
          className="mx-auto h-24 w-24 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
          />
        </svg>
        <h3 className="mt-6 text-lg font-semibold text-gray-900">
          Página de Agendamento em Desenvolvimento
        </h3>
        <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
          Estamos trabalhando para trazer a você uma experiência completa de agendamento de mentorias.
          Por enquanto, você pode conhecer nossos mentores na página de Mentorias.
        </p>
      </div>
    </div>
  )
}
