import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface SocialPopupProps {
  show: boolean;
  onClose: () => void;
}

export default function SocialPopup({ show, onClose }: SocialPopupProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          key="social-popup"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[190] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative w-full max-w-sm bg-[#13293D] border border-[#1E3A52] rounded-2xl p-6 text-center shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors">
              <X size={18} />
            </button>
            
            <div className="text-4xl mb-3">🏁</div>
            <h3 className="text-xl font-bold text-white">Join Our Garage!</h3>
            <p className="text-xs text-gray-400 mt-1 mb-5">Latest parts, deals & auto tips ke liye follow karein.</p>
            
            <div className="flex flex-col gap-3">
              <a 
                href="https://www.instagram.com/autobrothers.pk/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:opacity-90 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-lg shadow-pink-500/20"
              >
                Follow on Instagram
              </a>
              <a 
                href="https://www.facebook.com/profile.php?id=100064020401353" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-full flex items-center justify-center gap-2 bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold py-3 rounded-xl text-sm transition-all shadow-lg shadow-blue-500/20"
              >
                Follow on Facebook
              </a>
            </div>
            
            <button 
              onClick={onClose} 
              className="mt-4 text-[11px] text-gray-600 hover:text-gray-400 transition-colors"
            >
              Skip for now
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}