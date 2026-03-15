import Editor, { useMonaco } from '@monaco-editor/react';
import { Box } from '@mui/material';
import { useTheme } from '../contexts/ThemeContext';
import { useEffect } from 'react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  height?: string;
  readOnly?: boolean;
}

// Action 沙箱类型定义
const ACTION_SANDBOX_TYPES = `
/**
 * Chat Completion 请求参数
 */
interface ChatCompletionParams {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

/**
 * 调用 Chat Completion API
 */
declare function callChatCompletion(params: ChatCompletionParams): Promise<string>;

/**
 * 获取当前 Action 的元数据和配置
 */
declare const metadata: {
  name?: string;
  description?: string;
  version?: string;
  author?: string;
  category?: string;
  tags?: string[];
  schema?: Record<string, any>;
  config?: Record<string, any>;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
};

/**
 * Action 初始化函数
 */
declare function onInit(config: any): Promise<void>;

/**
 * Action 配置变更函数
 */
declare function onConfigChange(config: any): Promise<void>;

/**
 * Action 执行函数
 */
declare function execute(input: any): Promise<any>;
`;

export function CodeEditor({
  value,
  onChange,
  language = 'typescript',
  height = '400px',
  readOnly = false,
}: CodeEditorProps) {
  const { theme } = useTheme();
  const monaco = useMonaco();

  useEffect(() => {
    if (monaco && language === 'typescript') {
      // 添加 Action 沙箱类型定义
      const ts = monaco.languages.typescript;
      if (ts && 'typescriptDefaults' in ts) {
        (ts as any).typescriptDefaults.addExtraLib(
          ACTION_SANDBOX_TYPES,
          'action-sandbox.d.ts'
        );
      }
    }
  }, [monaco, language]);

  return (
    <Box sx={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <Editor
        height={height}
        defaultLanguage={language}
        language={language}
        value={value}
        onChange={(val) => onChange(val || '')}
        theme={theme.mode === 'dark' ? 'vs-dark' : 'vs-light'}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          readOnly,
          wordWrap: 'on',
          formatOnPaste: true,
          formatOnType: true,
        }}
      />
    </Box>
  );
}
