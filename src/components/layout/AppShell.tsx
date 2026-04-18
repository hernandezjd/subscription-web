import { useState } from 'react'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import Toolbar from '@mui/material/Toolbar'
import { Outlet } from 'react-router-dom'
import { AppHeader } from './AppHeader'
import { SideNav } from './SideNav'
import { VersionFooter } from '../VersionFooter'

const DRAWER_WIDTH = 220

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)

  function handleMenuToggle() {
    setMobileOpen((prev) => !prev)
  }

  const drawerContent = <SideNav />

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppHeader onMenuToggle={handleMenuToggle} />

      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleMenuToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH },
        }}
      >
        <Toolbar />
        {drawerContent}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          width: DRAWER_WIDTH,
          flexShrink: 0,
        }}
        open
      >
        <Toolbar />
        {drawerContent}
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Outlet />
        <VersionFooter />
      </Box>
    </Box>
  )
}
