import { motion } from 'framer-motion'
import { MessageSquare, GripHorizontal } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

export default function ChatPane() {
  const { openDrawer } = useAppStore()
  
  return (
    <div className="h-full flex flex-col bg-dark">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 safe-top">
        <div className="flex items-center gap-2">
          <MessageSquare size={24} className="text-primary" />
          <h1 className="text-xl font-bold">Chat</h1>
        </div>
        <p className="text-dark-500 text-sm mt-1">Matrix Hydrogen Integration</p>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-dark-100 flex items-center justify-center">
            <MessageSquare size={40} className="text-dark-400" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Matrix Chat</h2>
          <p className="text-dark-500 text-sm max-w-xs">
            Connect your Matrix account in Settings to enable secure, decentralized messaging.
          </p>
          <button className="mt-4 px-6 py-2 bg-primary/20 text-primary rounded-lg text-sm font-medium hover:bg-primary/30 transition-colors">
            Configure Matrix
          </button>
        </div>
      </div>
      
      {/* Drawer Handle */}
      <div 
        className="py-3 flex justify-center cursor-pointer hover:bg-dark-100 transition-colors"
        onClick={openDrawer}
      >
        <div className="flex flex-col items-center gap-1">
          <GripHorizontal size={20} className="text-dark-400" />
          <div className="w-10 h-1 rounded-full bg-dark-400" />
        </div>
      </div>
    </div>
  )
}
