import { XMarkIcon } from '@heroicons/react/20/solid';

export default function BetaBanner({ onDismiss }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-[60] flex items-center gap-x-6 bg-gray-900 px-6 py-2.5 sm:px-3.5 sm:before:flex-1">
      <p className="text-sm/6 text-white">
        <a href="mailto:contato@patronos.org">
          <strong className="font-semibold">Versao Beta</strong>
          <svg viewBox="0 0 2 2" aria-hidden="true" className="mx-2 inline size-0.5 fill-current">
            <circle r={1} cx={1} cy={1} />
          </svg>
          Esta e uma nova versao do Centro de Carreiras. Se encontrar algo que nao esta funcionando, envie um email para contato@patronos.org&nbsp;<span aria-hidden="true">&rarr;</span>
        </a>
      </p>
      <div className="flex flex-1 justify-end">
        <button type="button" onClick={onDismiss} className="-m-3 p-3 focus-visible:outline-offset-4">
          <span className="sr-only">Fechar</span>
          <XMarkIcon aria-hidden="true" className="size-5 text-white" />
        </button>
      </div>
    </div>
  );
}
