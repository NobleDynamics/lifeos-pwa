import { Cloud, Image, FileText, FolderOpen } from 'lucide-react'
import CategoryPane from '@/components/CategoryPane'

const tabs = [
  { id: 'photos', label: 'Photos', icon: Image },
  { id: 'files', label: 'Files', icon: FolderOpen },
  { id: 'docs', label: 'Docs', icon: FileText },
]

function PhotosTab() {
  return (
    <div className="p-4">
      <div className="grid grid-cols-3 gap-2">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="aspect-square bg-dark-200 rounded-lg animate-pulse" />
        ))}
      </div>
      <p className="text-center text-dark-500 text-sm mt-4">Connect Supabase to view photos</p>
    </div>
  )
}

function FilesTab() {
  return (
    <div className="p-4 space-y-2">
      {['Documents', 'Downloads', 'Pictures'].map(folder => (
        <div key={folder} className="flex items-center gap-3 p-3 glass-card">
          <FolderOpen size={20} className="text-primary" />
          <span>{folder}</span>
        </div>
      ))}
      <p className="text-center text-dark-500 text-sm mt-4">Connect Supabase to view files</p>
    </div>
  )
}

function DocsTab() {
  return (
    <div className="p-4 space-y-2">
      {['Meeting Notes', 'Ideas', 'Journal'].map(doc => (
        <div key={doc} className="flex items-center gap-3 p-3 glass-card">
          <FileText size={20} className="text-primary" />
          <span>{doc}</span>
        </div>
      ))}
      <p className="text-center text-dark-500 text-sm mt-4">Connect Supabase to view documents</p>
    </div>
  )
}

export default function CloudPane() {
  return (
    <CategoryPane
      title="Cloud"
      icon={Cloud}
      tabs={tabs}
      tabKey="cloud"
    >
      {(activeTab) => (
        <>
          {activeTab === 'photos' && <PhotosTab />}
          {activeTab === 'files' && <FilesTab />}
          {activeTab === 'docs' && <DocsTab />}
        </>
      )}
    </CategoryPane>
  )
}
