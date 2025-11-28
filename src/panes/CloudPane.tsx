import { Cloud, Image, FileText, FolderOpen } from 'lucide-react'
import CategoryPane from '@/components/CategoryPane'
import { HierarchyPane } from '@/components/HierarchyPane'

const tabs = [
  { id: 'files', label: 'Files', icon: FolderOpen },
  { id: 'photos', label: 'Photos', icon: Image },
  { id: 'docs', label: 'Docs', icon: FileText },
]

function FilesTab() {
  return <HierarchyPane context="cloud.files" title="Cloud" accentColor="#00EAFF" />
}

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
          {activeTab === 'files' && <FilesTab />}
          {activeTab === 'photos' && <PhotosTab />}
          {activeTab === 'docs' && <DocsTab />}
        </>
      )}
    </CategoryPane>
  )
}
