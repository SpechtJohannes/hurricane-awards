import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  type Category,
  type CategoryStatus,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from '../data/categories'

type CategoryFormState = {
  id: string | null
  title: string
  description: string
  status: CategoryStatus
  sortOrder: string
}

type AdminCategoriesProps = {
  categories: Category[]
  error: string
  isLoading: boolean
  updatingCategoryId: string | null
  deletingCategoryId: string | null
  onCreate: (input: CreateCategoryInput) => Promise<void>
  onUpdate: (input: UpdateCategoryInput) => Promise<void>
  onChangeStatus: (categoryId: string, status: CategoryStatus) => void
  onDelete: (category: Category) => void
}

export function AdminCategories({
  categories,
  error,
  isLoading,
  updatingCategoryId,
  deletingCategoryId,
  onCreate,
  onUpdate,
  onChangeStatus,
  onDelete,
}: AdminCategoriesProps) {
  const { t } = useTranslation()
  const [form, setForm] = useState<CategoryFormState | null>(null)
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const statusLabels: Record<CategoryStatus, string> = {
    upcoming: t('status.upcoming'),
    open: t('status.open'),
    closed: t('status.closed'),
  }

  function startCreate() {
    setFormError('')
    setForm({
      id: null,
      title: '',
      description: '',
      status: 'upcoming',
      sortOrder: '',
    })
  }

  function startEdit(category: Category) {
    setFormError('')
    setForm({
      id: category.id,
      title: category.title,
      description: category.description,
      status: category.status,
      sortOrder:
        category.sortOrder === undefined ? '' : String(category.sortOrder),
    })
  }

  function cancelForm() {
    setForm(null)
    setFormError('')
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form) {
      return
    }

    const title = form.title.trim()
    const description = form.description.trim()
    const parsedSortOrder =
      form.sortOrder.trim() === '' ? undefined : Number(form.sortOrder)

    if (!title) {
      setFormError(t('admin.categories.errors.titleRequired'))
      return
    }

    if (
      parsedSortOrder !== undefined &&
      (!Number.isInteger(parsedSortOrder) || parsedSortOrder < 0)
    ) {
      setFormError(t('admin.categories.errors.sortOrderInvalid'))
      return
    }

    setIsSaving(true)
    setFormError('')

    try {
      if (form.id) {
        await onUpdate({
          id: form.id,
          title,
          description,
          status: form.status,
          sortOrder: parsedSortOrder,
        })
      } else {
        await onCreate({
          title,
          description,
          status: form.status,
          sortOrder: parsedSortOrder,
        })
      }

      setForm(null)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : String(error))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <div className="admin__header">
        <p className="admin__eyebrow">{t('admin.eyebrow')}</p>
        <h2 id="admin-title">{t('admin.title')}</h2>
      </div>

      {error ? <p className="admin__notice">{error}</p> : null}

      <div className="admin-categories">
        <div className="admin-categories__toolbar">
          <button
            className="admin-card__reset admin-card__reset--primary"
            type="button"
            onClick={startCreate}
          >
            {t('admin.categories.createButton')}
          </button>
        </div>

        {form ? (
          <form className="admin-category-form" onSubmit={submitForm}>
            <h3>
              {form.id
                ? t('admin.categories.editTitle')
                : t('admin.categories.createTitle')}
            </h3>

            <label htmlFor="admin-category-title">
              {t('admin.categories.titleLabel')}
              <input
                id="admin-category-title"
                type="text"
                value={form.title}
                disabled={isSaving}
                onChange={(event) => {
                  setForm({ ...form, title: event.target.value })
                  setFormError('')
                }}
              />
            </label>

            <label htmlFor="admin-category-description">
              {t('admin.categories.descriptionLabel')}
              <textarea
                id="admin-category-description"
                value={form.description}
                disabled={isSaving}
                onChange={(event) => {
                  setForm({ ...form, description: event.target.value })
                  setFormError('')
                }}
              />
            </label>

            <label htmlFor="admin-category-status">
              {t('admin.categories.statusLabel')}
              <select
                id="admin-category-status"
                value={form.status}
                disabled={isSaving}
                onChange={(event) => {
                  setForm({
                    ...form,
                    status: event.target.value as CategoryStatus,
                  })
                  setFormError('')
                }}
              >
                <option value="upcoming">{t('admin.statusOptions.upcoming')}</option>
                <option value="open">{t('admin.statusOptions.open')}</option>
                <option value="closed">{t('admin.statusOptions.closed')}</option>
              </select>
            </label>

            <label htmlFor="admin-category-sort-order">
              {t('admin.categories.sortOrderLabel')}
              <input
                id="admin-category-sort-order"
                type="number"
                value={form.sortOrder}
                disabled={isSaving}
                onChange={(event) => {
                  setForm({ ...form, sortOrder: event.target.value })
                  setFormError('')
                }}
                inputMode="numeric"
              />
            </label>

            {formError ? (
              <p className="admin-participant-form__error">{formError}</p>
            ) : null}

            <div className="admin-participant-form__actions">
              <button
                className="admin-card__reset admin-card__reset--primary"
                type="submit"
                disabled={isSaving}
              >
                {isSaving ? t('common.saving') : t('admin.categories.save')}
              </button>
              <button
                className="admin-card__reset admin-card__reset--secondary"
                type="button"
                disabled={isSaving}
                onClick={cancelForm}
              >
                {t('admin.categories.cancel')}
              </button>
            </div>
          </form>
        ) : null}

        {isLoading ? (
          <p className="admin__notice" role="status">
            {t('admin.categories.loading')}
          </p>
        ) : (
          <div className="admin-categories__list">
            {categories.map((category) => (
              <article className="admin-category-card" key={category.id}>
                <div className="admin-category-card__main">
                  <h3>{category.title}</h3>
                  <p>{category.description}</p>
                  <dl>
                    <div>
                      <dt>{t('admin.categories.statusLabel')}</dt>
                      <dd>{statusLabels[category.status]}</dd>
                    </div>
                    <div>
                      <dt>{t('admin.categories.sortOrderLabel')}</dt>
                      <dd>{category.sortOrder ?? '-'}</dd>
                    </div>
                  </dl>
                </div>

                <div className="admin-category-card__controls">
                  <label>
                    {t('admin.changeStatus')}
                    <select
                      value={category.status}
                      disabled={
                        updatingCategoryId === category.id ||
                        deletingCategoryId === category.id
                      }
                      onChange={(event) =>
                        onChangeStatus(
                          category.id,
                          event.target.value as CategoryStatus,
                        )
                      }
                    >
                      <option value="upcoming">
                        {t('admin.statusOptions.upcoming')}
                      </option>
                      <option value="open">{t('admin.statusOptions.open')}</option>
                      <option value="closed">
                        {t('admin.statusOptions.closed')}
                      </option>
                    </select>
                  </label>

                  <div className="admin-category-card__actions">
                    <button
                      className="admin-card__reset admin-card__reset--secondary"
                      type="button"
                      disabled={deletingCategoryId === category.id}
                      onClick={() => startEdit(category)}
                    >
                      {t('admin.categories.edit')}
                    </button>
                    <button
                      className="admin-card__reset"
                      type="button"
                      disabled={deletingCategoryId === category.id}
                      onClick={() => onDelete(category)}
                    >
                      {deletingCategoryId === category.id
                        ? t('admin.categories.deleting')
                        : t('admin.categories.delete')}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
