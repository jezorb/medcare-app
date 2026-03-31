import { Link } from 'react-router-dom';
import { initials } from '../utils/helpers';
import { FiStar, FiClock, FiCreditCard, FiArrowRight, FiActivity } from 'react-icons/fi';

export default function DoctorCard({ doctor, cta = 'View Profile' }) {
  // Destructuring with fallback
  const name = doctor?.personalInfo?.name || doctor?.name || 'Doctor';
  const specializations = doctor?.professionalInfo?.specializations || doctor?.specialization || [];
  const experience = doctor?.professionalInfo?.experienceYears || doctor?.experienceYears;
  const fees = doctor?.professionalInfo?.consultationFees || doctor?.consultationFees;
  const rating = doctor?.ratingInfo?.averageRating || doctor?.rating || 0;
  const totalReviews = doctor?.ratingInfo?.totalReviews || doctor?.totalReviews || 0;
  const id = doctor?._id || doctor?.id;

  return (
    <div className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-300 flex flex-col h-full overflow-hidden">
      
      {/* Top Section: Avatar & Name */}
      <div className="p-5 flex items-start gap-4">
        <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
          {initials(name)}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
            {name}
          </h3>
          
          {/* Specialization Badges */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {specializations?.slice(0, 2).map((item) => (
              <span key={item} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                <FiActivity className="mr-1 text-[10px]" /> {item}
              </span>
            ))}
            {specializations?.length > 2 && (
              <span className="text-[10px] text-gray-400 self-center">+{specializations.length - 2} more</span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid: Experience, Fees, Ratings */}
      <div className="px-5 py-4 border-t border-gray-50 grid grid-cols-2 gap-y-3">
        <div className="flex items-center text-sm text-gray-600">
          <FiClock className="mr-2 text-blue-500" />
          <span>{experience || 0}+ Yrs Exp.</span>
        </div>
        <div className="flex items-center text-sm text-gray-600 justify-end">
          <FiCreditCard className="mr-2 text-green-500" />
          <span className="font-semibold text-gray-800">₹{fees ?? 0}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <FiStar className="mr-2 text-yellow-500 fill-current" />
          <span className="font-medium text-gray-800">{rating || 0}</span>
          <span className="ml-1 text-gray-400">({totalReviews})</span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-auto p-4 bg-gray-50/50 border-t border-gray-100 group-hover:bg-blue-50 transition-colors">
        <Link 
          className="flex items-center justify-center w-full py-2.5 px-4 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 group-hover:bg-blue-600 group-hover:text-white group-hover:border-transparent transition-all duration-300 shadow-sm " 
          to={`/doctors/${id}`}
        >
          {cta} <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>  
    </div>
  );
}