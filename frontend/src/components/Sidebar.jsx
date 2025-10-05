import { useLocation, Link } from 'react-router-dom'
import {
  HomeIcon,
  UserGroupIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Home', href: '/', icon: HomeIcon },
  { name: 'Mentorias', href: '/mentorias', icon: UserGroupIcon },
  { name: 'Vagas', href: '/vagas', icon: BriefcaseIcon },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Sidebar() {
  const location = useLocation()

  return (
    <div className="h-full flex flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 py-6">
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => {
                const current = location.pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={classNames(
                        current
                          ? 'bg-gray-50 text-patronos-accent'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-patronos-accent',
                        'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                      )}
                    >
                      <item.icon
                        aria-hidden="true"
                        className={classNames(
                          current ? 'text-patronos-accent' : 'text-gray-400 group-hover:text-patronos-accent',
                          'size-6 shrink-0',
                        )}
                      />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  )
}
