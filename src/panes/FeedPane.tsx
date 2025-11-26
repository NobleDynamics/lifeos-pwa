import { Rss, GripHorizontal, Send, Heart, MessageCircle, Repeat2 } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

// Mock feed posts
const mockPosts = [
  { id: 1, author: '@user', content: 'Just deployed my first LifeOS instance! 🚀', likes: 12, reposts: 3, time: '2h ago' },
  { id: 2, author: '@techie', content: 'The new dashboard HUD is looking amazing with the glassmorphism effects', likes: 45, reposts: 8, time: '5h ago' },
  { id: 3, author: '@dev', content: 'Working on some cool integrations for the household inventory system', likes: 23, reposts: 5, time: '1d ago' },
]

export default function FeedPane() {
  const { openDrawer } = useAppStore()
  
  return (
    <div className="h-full flex flex-col bg-dark">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 safe-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rss size={24} className="text-primary" />
            <h1 className="text-xl font-bold">Feed</h1>
          </div>
          <button className="p-2 rounded-lg bg-primary/20 text-primary">
            <Send size={18} />
          </button>
        </div>
        <p className="text-dark-500 text-sm mt-1">Mastodon / Fediverse</p>
      </div>
      
      {/* Feed Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {mockPosts.map((post) => (
          <div key={post.id} className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-primary/20" />
              <span className="font-medium text-sm">{post.author}</span>
              <span className="text-dark-500 text-xs ml-auto">{post.time}</span>
            </div>
            <p className="text-sm mb-3">{post.content}</p>
            <div className="flex items-center gap-4 text-dark-500 text-xs">
              <button className="flex items-center gap-1 hover:text-accent-red transition-colors">
                <Heart size={14} />
                <span>{post.likes}</span>
              </button>
              <button className="flex items-center gap-1 hover:text-accent-green transition-colors">
                <Repeat2 size={14} />
                <span>{post.reposts}</span>
              </button>
              <button className="flex items-center gap-1 hover:text-primary transition-colors">
                <MessageCircle size={14} />
              </button>
            </div>
          </div>
        ))}
        
        <p className="text-center text-dark-500 text-sm py-4">
          Connect Mastodon in Settings for live feed
        </p>
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
