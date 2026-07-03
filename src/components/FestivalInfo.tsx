import { useTranslation } from 'react-i18next'
import {
  festivalDocumentTypes,
  type FestivalDocument,
  type FestivalDocumentType,
} from '../data/festivalDocuments'

type FestivalInfoProps = {
  documents: FestivalDocument[]
  campLocationLink: string | null
  campLocationError: string
  error: string
  isLoading: boolean
  onOpenCampLocation: () => void
}

function documentByType(
  documents: FestivalDocument[],
  documentType: FestivalDocumentType,
) {
  return documents.find((document) => document.documentType === documentType)
}

function isImageDocument(document: FestivalDocument) {
  return document.mimeType.startsWith('image/')
}

export function FestivalInfo({
  documents,
  campLocationLink,
  campLocationError,
  error,
  isLoading,
  onOpenCampLocation,
}: FestivalInfoProps) {
  const { t } = useTranslation()
  const hasDocuments = documents.length > 0
  const hasCampLocationLink = Boolean(campLocationLink)

  return (
    <section
      className="festival-info"
      id="main-info"
      aria-labelledby="festival-info-title"
    >
      <div className="festival-info__header">
        <p className="festival-info__eyebrow">{t('info.eyebrow')}</p>
        <h2 id="festival-info-title">{t('info.title')}</h2>
      </div>

      {isLoading ? (
        <p className="festival-info__notice" role="status">
          {t('info.loading')}
        </p>
      ) : null}

      {error ? (
        <p className="festival-info__notice festival-info__notice--error" role="alert">
          {error}
        </p>
      ) : null}

      {!isLoading && !error && !hasDocuments && !hasCampLocationLink ? (
        <p className="festival-info__notice">{t('info.empty')}</p>
      ) : null}

      {hasCampLocationLink ? (
        <article className="festival-info__camp-location">
          <div>
            <p>{t('info.campLocation.eyebrow')}</p>
            <h3>{t('info.campLocation.title')}</h3>
          </div>
          <button
            className="festival-info__camp-location-link"
            type="button"
            onClick={onOpenCampLocation}
          >
            {t('info.campLocation.open')}
          </button>
          {campLocationError ? (
            <p className="festival-info__notice festival-info__notice--error" role="alert">
              {campLocationError}
            </p>
          ) : null}
        </article>
      ) : null}

      {hasDocuments ? (
        <div className="festival-info__documents">
          {festivalDocumentTypes.map((documentType) => {
            const document = documentByType(documents, documentType)

            if (!document) {
              return null
            }

            return (
              <article className="festival-document" key={document.documentType}>
                <div className="festival-document__header">
                  <p>{t(`info.documentTypes.${document.documentType}`)}</p>
                  <h3>{document.title}</h3>
                </div>

                {isImageDocument(document) ? (
                  <img
                    src={document.displayUrl}
                    alt={document.title}
                    className="festival-document__preview"
                  />
                ) : (
                  <iframe
                    className="festival-document__preview"
                    src={document.displayUrl}
                    title={document.title}
                  />
                )}
              </article>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}
