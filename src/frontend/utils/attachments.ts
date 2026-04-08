/**
 * 附件处理工具函数
 */

export interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  data?: string;
}

/**
 * 上传附件到服务器
 */
export async function uploadAttachment(
  token: string,
  sessionId: string,
  messageId: string,
  fileName: string,
  fileType: string,
  dataUrl: string
): Promise<Attachment> {
  const response = await fetch('/api/attachments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      sessionId,
      messageId,
      fileName,
      fileType,
      data: dataUrl,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to upload attachment');
  }

  const result = await response.json();
  return result.attachment;
}

/**
 * 从服务器获取附件并创建Blob URL
 */
export async function getAttachmentBlobUrl(
  token: string,
  attachmentId: string
): Promise<string> {
  const response = await fetch(`/api/attachments/${attachmentId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get attachment');
  }

  const result = await response.json();
  const { data, fileType } = result.attachment;

  // 将base64转换为Blob
  const blob = dataURLtoBlob(data);
  
  // 创建Blob URL
  return URL.createObjectURL(blob);
}

/**
 * 删除附件
 */
export async function deleteAttachment(
  token: string,
  attachmentId: string
): Promise<boolean> {
  const response = await fetch(`/api/attachments/${attachmentId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete attachment');
  }

  const result = await response.json();
  return result.success;
}

/**
 * 将Data URL转换为Blob
 */
function dataURLtoBlob(dataURL: string): Blob {
  const matches = dataURL.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid data URL');
  }

  const mimeType = matches[1];
  const base64 = matches[2];
  
  // 解码base64
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * 清理Blob URL
 */
export function revokeBlobUrl(url: string): void {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}
