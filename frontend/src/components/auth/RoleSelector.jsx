import { AcademicCapIcon, BriefcaseIcon } from '@heroicons/react/24/outline';

export default function RoleSelector({ value, onChange, error }) {
  const roles = [
    {
      id: 'estudante',
      label: 'Sou Estudante',
      description: 'Busco mentoria para minha carreira',
      icon: AcademicCapIcon,
    },
    {
      id: 'mentor',
      label: 'Sou Mentor',
      description: 'Quero ajudar estudantes',
      icon: BriefcaseIcon,
    },
  ];

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Você é:
      </label>
      <div className="grid grid-cols-2 gap-4">
        {roles.map((role) => {
          const Icon = role.icon;
          const isSelected = value === role.id;

          return (
            <button
              key={role.id}
              type="button"
              onClick={() => onChange(role.id)}
              className={`
                relative p-4 border-2 rounded-xl text-center transition-all duration-200
                ${isSelected
                  ? 'border-patronos-accent bg-patronos-accent/5 ring-2 ring-patronos-accent/20'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <Icon
                className={`mx-auto h-8 w-8 ${
                  isSelected ? 'text-patronos-accent' : 'text-gray-400'
                }`}
              />
              <p
                className={`mt-2 font-medium ${
                  isSelected ? 'text-patronos-accent' : 'text-gray-900'
                }`}
              >
                {role.label}
              </p>
              <p className="mt-1 text-xs text-gray-500">{role.description}</p>
            </button>
          );
        })}
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
