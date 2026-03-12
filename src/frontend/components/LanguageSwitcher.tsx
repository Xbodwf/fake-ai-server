import { useTranslation } from 'react-i18next';
import { Button, Menu, MenuItem } from '@mui/material';
import { useState } from 'react';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    handleClose();
  };

  const currentLang = i18n.language === 'zh' ? '中文' : 'English';

  return (
    <>
      <Button
        startIcon={<Globe size={20} />}
        onClick={handleClick}
        size="small"
        sx={{ textTransform: 'none' }}
      >
        {currentLang}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem
          onClick={() => handleLanguageChange('en')}
          selected={i18n.language === 'en'}
        >
          English
        </MenuItem>
        <MenuItem
          onClick={() => handleLanguageChange('zh')}
          selected={i18n.language === 'zh'}
        >
          中文
        </MenuItem>
      </Menu>
    </>
  );
}
