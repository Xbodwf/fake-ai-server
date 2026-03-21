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

  // 检查语言代码，支持 'zh', 'zh-CN', 'zh-Hans' 等变体
  const isZh = i18n.language.startsWith('zh');
  const currentLang = isZh ? '中文' : 'English';

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
          selected={!isZh}
        >
          English
        </MenuItem>
        <MenuItem
          onClick={() => handleLanguageChange('zh')}
          selected={isZh}
        >
          中文
        </MenuItem>
      </Menu>
    </>
  );
}
