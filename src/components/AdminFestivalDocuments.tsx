import { type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  festivalDocumentTypes,
  type FestivalDocument,
  type FestivalDocumentType,
} from '../data/festivalDocuments'

type AdminFestivalDocumentsProps = {
  documents: FestivalDocument[]
  error: string
  isLoading: boolean
  uploadingDocumentType: FestivalDocumentType | null
  removingDocumentType: FestivalDocumentType | null
  onUpload: (documentType: FestivalDocumentType, file: File) => void
  onRemove: (documentType: FestivalDocumentType) => void
}

function documentByType(
  documents: FestivalDocument[],
  documentType: FestivalDocumentType,
) {
  return documents.find((document) => document.documentType === documentType)
}

export function AdminFestivalDocuments({
  documents,
  error,
  isLoading,
  uploadingDocumentType,
  removingDocumentType,
  onUpload,
  onRemove,
}: AdminFestivalDocumentsProps) {
  const { t } = useTranslation()

  function changeFile(
    documentType: FestivalDocumentType,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    onUpload(documentType, file)
  }

  return (
    <>
      <div className="admin__header admin__header--documents">
        <p className="admin__eyebrow">{t('admin.documents.eyebrow')}</p>
        <h2>{t('admin.documents.title')}</h2>
      </div>

      {error ? <p className="admin__notice" role="alert">{error}</p> : null}

      {isLoading ? (
        <p className="admin__notice" role="status">
          {t('admin.documents.loading')}
        </p>
      ) : null}

      <div className="admin-documents">
        {festivalDocumentTypes.map((documentType) => {
          const document = documentByType(documents, documentType)
          const inputId = `admin-document-${documentType}`
          const isUploading = uploadingDocumentType === documentType
          const isRemoving = removingDocumentType === documentType

          return (
            <article className="admin-document-card" key={documentType}>
              <div className="admin-document-card__main">
                <p>{t(`info.documentTypes.${documentType}`)}</p>
                <h3>
                  {document?.title ?? t('admin.documents.emptyDocument')}
                </h3>
                {document ? (
                  <dl>
                    <div>
                      <dt>{t('admin.documents.fileType')}</dt>
                      <dd>{document.mimeType}</dd>
                    </div>
                    <div>
                      <dt>{t('admin.documents.updatedAt')}</dt>
                      <dd>
                        {new Intl.DateTimeFormat(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        }).format(new Date(document.updatedAt))}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <p className="admin-document-card__notice">
                    {t('admin.documents.missingDocument')}
                  </p>
                )}
              </div>

              <div className="admin-document-card__actions">
                <label
                  className="admin-card__reset admin-card__reset--primary"
                  htmlFor={inputId}
                >
                  {isUploading
                    ? t('admin.documents.uploading')
                    : document
                      ? t('admin.documents.replace')
                      : t('admin.documents.upload')}
                </label>
                <input
                  id={inputId}
                  className="admin-document-card__file"
                  type="file"
                  accept="application/pdf,image/*"
                  disabled={isUploading || isRemoving}
                  onChange={(event) => changeFile(documentType, event)}
                />

                {document ? (
                  <button
                    className="admin-card__reset admin-card__reset--secondary"
                    type="button"
                    disabled={isUploading || isRemoving}
                    onClick={() => onRemove(documentType)}
                  >
                    {isRemoving
                      ? t('admin.documents.removing')
                      : t('admin.documents.remove')}
                  </button>
                ) : null}
              </div>
            </article>
          )
        })}
      </div>
    </>
  )
}
