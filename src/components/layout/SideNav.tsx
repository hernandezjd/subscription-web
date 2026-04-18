import { useTranslation } from 'react-i18next'
import { useLocation, Link as RouterLink } from 'react-router-dom'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'

const NAV_ITEMS = [
  { path: '/', labelKey: 'navigation.dashboard' },
  { path: '/plans', labelKey: 'navigation.plans' },
  { path: '/history', labelKey: 'navigation.history' },
]

export function SideNav() {
  const { t } = useTranslation()
  const location = useLocation()

  return (
    <List>
      {NAV_ITEMS.map((item) => (
        <ListItem key={item.path} disablePadding>
          <ListItemButton
            component={RouterLink}
            to={item.path}
            selected={location.pathname === item.path}
          >
            <ListItemText primary={t(item.labelKey)} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  )
}
