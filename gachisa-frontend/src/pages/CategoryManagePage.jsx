import { useCallback, useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import { getErrorMessage } from '../api/errorMessage'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/categoryApi'
import LoadingScreen from '../components/LoadingScreen.jsx'

function CategoryNode({ node, depth, onRefetch }) {
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [addSubmitting, setAddSubmitting] = useState(false)
  const [addError, setAddError] = useState('')

  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(node.name)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState('')

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const handleAddChild = async (e) => {
    e.preventDefault()
    setAddError('')
    setAddSubmitting(true)
    try {
      await createCategory({ name: newName, parentId: node.id })
      setNewName('')
      setAddOpen(false)
      onRefetch()
    } catch (err) {
      setAddError(getErrorMessage(err, '하위 카테고리 추가에 실패했습니다.'))
    } finally {
      setAddSubmitting(false)
    }
  }

  const handleUpdateName = async () => {
    setEditError('')
    setEditSubmitting(true)
    try {
      await updateCategory(node.id, { name: editName })
      setEditing(false)
      onRefetch()
    } catch (err) {
      setEditError(getErrorMessage(err, '이름 수정에 실패했습니다.'))
    } finally {
      setEditSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setDeleteError('')
    setDeleteSubmitting(true)
    try {
      await deleteCategory(node.id)
      setDeleteOpen(false)
      onRefetch()
    } catch (err) {
      setDeleteError(getErrorMessage(err, '카테고리 삭제에 실패했습니다.'))
      setDeleteSubmitting(false)
    }
  }

  return (
    <>
      <ListItem sx={{ pl: 2 + depth * 3, alignItems: 'flex-start', flexWrap: 'wrap' }} divider>
        {editing ? (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexGrow: 1, py: 0.5 }}>
            <TextField
              size="small"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              autoFocus
            />
            <Button size="small" variant="contained" onClick={handleUpdateName} disabled={editSubmitting}>
              저장
            </Button>
            <Button
              size="small"
              onClick={() => {
                setEditing(false)
                setEditName(node.name)
                setEditError('')
              }}
            >
              취소
            </Button>
          </Stack>
        ) : (
          <>
            <ListItemText primary={node.name} sx={{ flexGrow: 1 }} />
            <Stack direction="row" spacing={1}>
              <Button size="small" onClick={() => setAddOpen((v) => !v)}>
                하위 카테고리 추가
              </Button>
              <Button size="small" onClick={() => setEditing(true)}>
                이름 수정
              </Button>
              <Button size="small" color="error" onClick={() => setDeleteOpen(true)}>
                삭제
              </Button>
            </Stack>
          </>
        )}
      </ListItem>
      {editError && (
        <Alert severity="error" sx={{ ml: 2 + depth * 3, mr: 2 }}>
          {editError}
        </Alert>
      )}

      {addOpen && (
        <Box component="form" onSubmit={handleAddChild} sx={{ pl: 2 + depth * 3, pr: 2, py: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            {addError && <Alert severity="error">{addError}</Alert>}
            <TextField
              size="small"
              label="하위 카테고리 이름"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              autoFocus
            />
            <Button type="submit" size="small" variant="contained" disabled={addSubmitting}>
              추가
            </Button>
          </Stack>
        </Box>
      )}

      {(node.children ?? []).map((child) => (
        <CategoryNode key={child.id} node={child} depth={depth + 1} onRefetch={onRefetch} />
      ))}

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>카테고리 삭제</DialogTitle>
        <DialogContent>
          <DialogContentText>
            &apos;{node.name}&apos; 카테고리를 삭제하시겠습니까? 하위 카테고리나 등록된 상품이 있으면 삭제가 거부될
            수 있습니다.
          </DialogContentText>
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>취소</Button>
          <Button color="error" onClick={handleDelete} disabled={deleteSubmitting}>
            삭제
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default function CategoryManagePage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [rootOpen, setRootOpen] = useState(false)
  const [rootName, setRootName] = useState('')
  const [rootSubmitting, setRootSubmitting] = useState(false)
  const [rootError, setRootError] = useState('')

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await getCategories()
      setCategories(data)
    } catch (err) {
      setError(getErrorMessage(err, '카테고리 목록을 불러오지 못했습니다.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleAddRoot = async (e) => {
    e.preventDefault()
    setRootError('')
    setRootSubmitting(true)
    try {
      await createCategory({ name: rootName, parentId: null })
      setRootName('')
      setRootOpen(false)
      fetchCategories()
    } catch (err) {
      setRootError(getErrorMessage(err, '카테고리 추가에 실패했습니다.'))
    } finally {
      setRootSubmitting(false)
    }
  }

  if (loading) return <LoadingScreen />

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>
          카테고리 관리
        </Typography>
        <Button variant="contained" onClick={() => setRootOpen((v) => !v)}>
          루트 카테고리 추가
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {rootOpen && (
        <Paper component="form" onSubmit={handleAddRoot} sx={{ p: 2, mb: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            {rootError && <Alert severity="error">{rootError}</Alert>}
            <TextField
              size="small"
              label="카테고리 이름"
              value={rootName}
              onChange={(e) => setRootName(e.target.value)}
              required
              autoFocus
            />
            <Button type="submit" variant="contained" disabled={rootSubmitting}>
              추가
            </Button>
          </Stack>
        </Paper>
      )}

      <Paper>
        <List disablePadding>
          {categories.length === 0 ? (
            <ListItem>
              <ListItemText primary="등록된 카테고리가 없습니다." />
            </ListItem>
          ) : (
            categories.map((node) => (
              <CategoryNode key={node.id} node={node} depth={0} onRefetch={fetchCategories} />
            ))
          )}
        </List>
      </Paper>
    </Box>
  )
}
