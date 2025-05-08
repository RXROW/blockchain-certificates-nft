import { FaGraduationCap, FaUniversity, FaCertificate, FaCog, FaUser, FaInfoCircle, FaSignOutAlt, FaFire } from 'react-icons/fa';

const Sidebar = ({ isOpen, toggleSidebar, isAdmin, isInstitute }) => {
  return (
    <div className="overflow-y-auto py-4 px-3 h-full">
      <ul className="space-y-2">
        {(isAdmin || isInstitute) && (
          <li>
            <NavLink
              to="/burn-requests"
              className={({ isActive }) =>
                `flex items-center p-2 text-base font-normal rounded-lg hover:bg-gray-700 group transition-colors ${
                  isActive ? 'bg-gray-700 text-white' : 'text-gray-400'
                }`
              }
            >
              <FaFire className="w-6 h-6 transition-colors group-hover:text-white" />
              <span className="ml-3">Burn Requests</span>
            </NavLink>
          </li>
        )}
      </ul>
    </div>
  );
};

export default Sidebar; 