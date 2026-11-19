import { useState } from "react"

type ReceiptDropzoneProps = {
  isUploading: boolean
  onUpload: () => void
  onDropFiles: (files: File[]) => void
}

export function ReceiptDropzone({ isUploading, onUpload, onDropFiles }: ReceiptDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    const files = event.dataTransfer.files
    if (files && files.length > 0) {
      onDropFiles(Array.from(files))
    }
  }

  return (
    <div
      className={`receipt-dropzone ${isDragging ? "active" : ""}`}
      role="button"
      tabIndex={0}
      onClick={onUpload}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onUpload()
        }
      }}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isUploading ? (
        <span className="receipt-dropzone-status">Saving...</span>
      ) : (
        <>
          <span className="receipt-dropzone-hint">Drag & drop a receipt image or PDF here</span>
          <span className="receipt-browse-label">Browse Files</span>
        </>
      )}
    </div>
  )
}