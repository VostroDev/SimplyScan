import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Trash2 } from 'lucide-react'

interface SortablePageProps {
  id: string
  image: string
  index: number
  onDelete: (id: string) => void
}

export function SortablePage({ id, image, index, onDelete }: SortablePageProps): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab'
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative group bg-white p-2 rounded-lg shadow-sm border border-gray-200 touch-none"
    >
      <div className="aspect-[1/1.41] overflow-hidden rounded-md bg-gray-100 relative pointer-events-none">
        <img src={image} alt={`Page ${index + 1}`} className="w-full h-full object-contain" />
      </div>

      {/* Delete button needs to stop propagation to avoid drag start */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onDelete(id)
          }}
          className="p-2 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 cursor-pointer"
          title="Delete Page"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-2 text-center text-sm text-gray-500">Page {index + 1}</div>
    </div>
  )
}
