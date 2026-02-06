import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function BetaBanner() {
  return (
    <div className="bg-orange-50 border-b border-orange-200">
      <div className="px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-start gap-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-orange-800">
            <span className="font-semibold">Versão Beta</span>
            <span className="mx-1">—</span>
            <span>
              Esta é uma nova versão do Centro de Carreiras e algumas funcionalidades podem apresentar instabilidades.
              Se encontrar algo que não está funcionando, por favor envie um email para{' '}
              <a
                href="mailto:contato@patronos.org"
                className="font-medium underline hover:text-orange-900"
              >
                contato@patronos.org
              </a>{' '}
              descrevendo o problema.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
