import { ProjectImage } from './ProjectImage'

interface Props {
  images: string[]
  /** used to build each image's alt text */
  name: string
}

/**
 * Work-image grid: images sit two-per-row; a trailing odd image spans the
 * full width so the grid never leaves a lonely half-row.
 */
export function ProjectGallery({ images, name }: Props) {
  if (!images.length) return null
  const isOdd = images.length % 2 === 1

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {images.map((src, i) => {
        const spanFull = isOdd && i === images.length - 1
        return (
          <div key={src} className={spanFull ? 'md:col-span-2' : ''}>
            <ProjectImage src={src} alt={`${name} — ${i + 1}`} />
          </div>
        )
      })}
    </div>
  )
}
