import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { Link } from 'react-router-dom'

const user = {
  name: 'Mentor',
  email: 'mentor@unicamp.br',
  imageUrl:
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
}

const userNavigation = [
  { name: 'Meu Perfil', href: '/perfil' },
  { name: 'Sair', href: '#' },
]

export default function Navbar() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <img
              alt="Centro de Carreiras - Unicamp"
              src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
              className="h-8 w-auto"
            />
            <span className="ml-3 text-xl font-bold text-patronos-accent">
              Centro de Carreiras
            </span>
          </div>

          {/* Profile dropdown */}
          <div className="flex items-center">
            <Menu as="div" className="relative">
              <MenuButton className="relative flex items-center gap-x-3 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-patronos-accent">
                <span className="hidden lg:flex lg:items-center">
                  <span className="text-sm font-semibold text-gray-900" aria-hidden="true">
                    {user.name}
                  </span>
                </span>
                <img
                  alt=""
                  src={user.imageUrl}
                  className="size-8 rounded-full bg-gray-100 outline -outline-offset-1 outline-black/5"
                />
              </MenuButton>

              <MenuItems
                transition
                className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg outline-1 outline-black/5 transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
              >
                {userNavigation.map((item) => (
                  <MenuItem key={item.name}>
                    {item.href === '#' ? (
                      <a
                        href={item.href}
                        className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:outline-hidden"
                      >
                        {item.name}
                      </a>
                    ) : (
                      <Link
                        to={item.href}
                        className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:outline-hidden"
                      >
                        {item.name}
                      </Link>
                    )}
                  </MenuItem>
                ))}
              </MenuItems>
            </Menu>
          </div>
        </div>
      </div>
    </header>
  )
}
