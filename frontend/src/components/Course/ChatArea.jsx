import { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import { Send, Smile, Paperclip, Image as ImageIcon, File, X, Sun, Moon, Plus } from 'lucide-react';

import SearchCourse from './SearchCourse.jsx'

import { getMessages, presignUpload, presignDownload } from "@/api/messageApi";
import { markCourseRead } from "@/api/courseApi";
import { useAuth } from "@/context/AuthContext.jsx";
import { useTheme } from "@/context/ThemeContext";
import { useCourseRoom } from "@/hooks/useCourseRoom";
import { App, Button } from "antd";

export default function ChatArea({ socket, course, onSelectCourse, onCreateClick }) {
  const { message, notification } = App.useApp();
  const { user } = useAuth();
  const myId = user?.userId || user?._id || user?.id;

  const [messages, setMessages] = useState([]); // messages array
  const [inputValue, setInputValue] = useState(""); // input value
  const [loading, setLoading] = useState(false); // loading state for messages
  const [sending, setSending] = useState(false); // sending state for messages
  const [selectedFiles, setSelectedFiles] = useState([]); // selected files array (for file/image upload)
  const [uploadProgress, setUploadProgress] = useState(0); // upload progress (0-100)
  const [isUploading, setIsUploading] = useState(false); // uploading state

  const courseId = useMemo(() => course?._id || course?.id, [course]);

  // Snapshot for resuming S3 uploads after a failed presign or PUT.
  const uploadRetryRef = useRef(null);
  // Last socket emit payload so "Retry send" can re-emit without re-uploading files.
  const pendingEmitRef = useRef(null);

  // Generates a Mongo-like 24-char ObjectId for presign attachment keying.
  function generateMessageId() {
    const bytes = new Uint8Array(12);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }

  // Socket Logic — socket is owned by Course.jsx to enable global unread tracking
  useCourseRoom({ socket, courseId, setMessages });

  // Scroll refs
  const scrollRef = useRef(null);      // the scrollable MessagesArea div
  const bottomRef = useRef(null);      // the bottom anchor
  const prevLenRef = useRef(0);        // previous messages length
  const prevCourseIdRef = useRef(courseId); // previous course

  // When switching courses: reset tracking of scroll Refs and clear messages
  useLayoutEffect(() => {
    if (prevCourseIdRef.current !== courseId) {
      prevLenRef.current = 0;
      prevCourseIdRef.current = courseId;

      setMessages([]);
      setInputValue("");
      setSelectedFiles([]);
      setUploadProgress(0);
      setIsUploading(false);
      uploadRetryRef.current = null;
      pendingEmitRef.current = null;

      const container = scrollRef.current;
      if (container) container.scrollTop = 0;
    }
  }, [courseId]);

  // Scroll behavior (runs BEFORE paint => no visible jump)
  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const prevLen = prevLenRef.current;
    const nextLen = messages.length;
    const isInitialLoad = prevLen === 0 && nextLen > 0;
    const isNewMessage = prevLen > 0 && nextLen > prevLen;

    const hasOverflow = container.scrollHeight > container.clientHeight;
    if (isInitialLoad) {
      if (hasOverflow) container.scrollTop = container.scrollHeight;
      else container.scrollTop = 0; // Explicitly keep at top when no overflow to prevent browser auto-scroll
    } 
    else if (isNewMessage) {
      if (hasOverflow) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    
    prevLenRef.current = nextLen;
  }, [messages, courseId]);

  // Double-check after paint to prevent browser from auto-scrolling when no overflow
  useEffect(() => {
    if (!loading && messages.length > 0) {
      const container = scrollRef.current;
      if (!container) return;
      
      // Use multiple checks to catch any browser auto-scroll
      const checkAndReset = () => {
        const hasOverflow = container.scrollHeight > container.clientHeight;
        if (!hasOverflow && container.scrollTop !== 0) {
          // If no overflow but scrolled away from top, reset to top
          container.scrollTop = 0;
        }
      };
      
      // Check immediately
      checkAndReset();
      // Check after next frame
      requestAnimationFrame(checkAndReset);
      // Check after a small delay to catch any late scroll
      setTimeout(checkAndReset, 10);
    }
  }, [loading, messages.length]);

  // Load messages whenever selected course changes; failed loads show a toast with Retry.
  useEffect(() => {
    let cancelled = false;

    async function loadMessages() {
      if (!courseId) {
        setMessages([]);
        return;
      }
      try {
        setLoading(true);
        const data = await getMessages(courseId, { limit: 40 });
        if (cancelled) return;
        const list = Array.isArray(data?.messages) ? [...data.messages].reverse() : [];
        setMessages(list);
        await markCourseRead(courseId).catch(() => {});
      } catch (err) {
        if (cancelled) return;
        notification.error({
          key: "course-load-msgs",
          message: "Could not load messages",
          description: String(err?.message || "Unknown error"),
          duration: 0,
          btn: (
            <Button
              type="primary"
              size="small"
              onClick={() => {
                notification.destroy("course-load-msgs");
                void loadMessages();
              }}
            >
              Retry
            </Button>
          ),
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadMessages();
    return () => {
      cancelled = true;
    };
  }, [courseId, notification]);
  
  // Reset message length tracking when course changes
  useEffect(() => {
    if (prevCourseIdRef.current !== courseId) {
      prevLenRef.current = 0;
      prevCourseIdRef.current = courseId;
    }
  }, [courseId]);
  

  // Uploads from startIndex and updates uploadRetryRef so a failed step can be retried.
  async function runFileUploads(messageId, text, files, startIndex, uploadedAttachments) {
    const total = files.length;
    for (let index = startIndex; index < total; index += 1) {
      uploadRetryRef.current = {
        messageId,
        text,
        files,
        startIndex: index,
        uploadedAttachments: [...uploadedAttachments],
      };
      const file = files[index];
      const contentType = file.type || "application/octet-stream"; // default to binary if no type
      const { putUrl, key } = await presignUpload({
        messageId,
        contentType,
        fileName: file.name,
        courseId,
      });
      const uploadRes = await fetch(putUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: file,
      });
      if (!uploadRes.ok) throw new Error(`Upload failed for ${file.name}`);
      uploadedAttachments.push({
        kind: contentType.startsWith("image/") ? "image" : "file",
        url: key,
        name: file.name,
        size: file.size,
        mime: contentType,
      });
      setUploadProgress(Math.round(((index + 1) / total) * 100));
    }
    uploadRetryRef.current = null;
    return uploadedAttachments;
  }

  // Shows a persistent toast with Retry upload using the last failed upload snapshot.
  function showUploadRetryNotification(errMsg) {
    notification.destroy("chat-upload-retry");
    notification.error({
      key: "chat-upload-retry",
      message: "Upload failed",
      description: errMsg,
      duration: 0,
      btn: (
        <Button
          type="primary"
          size="small"
          onClick={() => {
            notification.destroy("chat-upload-retry");
            void resumeFailedUpload();
          }}
        >
          Retry upload
        </Button>
      ),
    });
  }

  // Continues presign + PUT from the failed file index, then emits the course message.
  async function resumeFailedUpload() {
    const snap = uploadRetryRef.current;
    if (!snap || !courseId || !socket || sending || isUploading) return;
    const { messageId, text, files, startIndex, uploadedAttachments } = snap;
    setSending(true);
    setIsUploading(true);
    setUploadProgress(
      files.length ? Math.round((uploadedAttachments.length / files.length) * 100) : 0,
    );
    try {
      const finalAttachments = await runFileUploads(
        messageId,
        text,
        files,
        startIndex,
        [...uploadedAttachments],
      );
      const sentAt = Date.now();
      pendingEmitRef.current = {
        courseId,
        type: "file",
        content: text,
        attachments: finalAttachments,
        sentAt,
      };
      socket.emit("sendCourseMessage", {
        courseId,
        type: "file",
        content: text,
        attachments: finalAttachments,
      });
      setSelectedFiles([]);
      setInputValue("");
      window.setTimeout(() => {
        if (pendingEmitRef.current?.sentAt === sentAt) pendingEmitRef.current = null;
      }, 20000);
    } catch (err) {
      showUploadRetryNotification(err?.message || "Failed to upload");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setSending(false);
    }
  }

  // Socket errors from the server (e.g. validation); offers Retry send for a recent emit.
  useEffect(() => {
    if (!socket) return;
    const onErr = (payload) => {
      const desc = String(payload?.error || "Something went wrong");
      const pending = pendingEmitRef.current;
      const canRetrySend =
        pending &&
        String(pending.courseId) === String(courseId) &&
        typeof pending.sentAt === "number" &&
        Date.now() - pending.sentAt < 20000;
      notification.destroy("chat-socket-err");
      notification.error({
        key: "chat-socket-err",
        message: "Something went wrong",
        description: desc,
        duration: canRetrySend ? 0 : 8,
        btn: canRetrySend ? (
          <Button
            type="primary"
            size="small"
            onClick={() => {
              notification.destroy("chat-socket-err");
              socket.emit("sendCourseMessage", {
                courseId: pending.courseId,
                type: pending.type,
                content: pending.content,
                attachments: pending.attachments || [],
              });
              message.success("Sending again…");
            }}
          >
            Retry send
          </Button>
        ) : null,
      });
    };
    socket.on("errorMessage", onErr);
    return () => socket.off("errorMessage", onErr);
  }, [socket, courseId, notification, message]);

  // Handle when click send
  async function handleSend() {
    const text = inputValue.trim();
    const hasFiles = selectedFiles.length > 0;
    if ((!text && !hasFiles) || !courseId || sending || !socket || isUploading) return;

    pendingEmitRef.current = null;
    uploadRetryRef.current = null;

    setSending(true);
    try {
      if (hasFiles) {
        setIsUploading(true);
        setUploadProgress(0);
        const messageId = generateMessageId();
        const files = [...selectedFiles];
        const uploadedAttachments = [];
        try {
          await runFileUploads(messageId, text, files, 0, uploadedAttachments);
        } catch (uploadErr) {
          showUploadRetryNotification(uploadErr?.message || "Failed to upload");
          return;
        } finally {
          setIsUploading(false);
          setUploadProgress(0);
        }

        const sentAt = Date.now();
        pendingEmitRef.current = {
          courseId,
          type: "file",
          content: text,
          attachments: uploadedAttachments,
          sentAt,
        };
        socket.emit("sendCourseMessage", {
          courseId,
          type: "file",
          content: text,
          attachments: uploadedAttachments,
        });
        setSelectedFiles([]);
        setInputValue("");
        window.setTimeout(() => {
          if (pendingEmitRef.current?.sentAt === sentAt) pendingEmitRef.current = null;
        }, 20000);
      } else {
        const sentAt = Date.now();
        pendingEmitRef.current = {
          courseId,
          type: "text",
          content: text,
          attachments: [],
          sentAt,
        };
        socket.emit("sendCourseMessage", { courseId, type: "text", content: text });
        setInputValue("");
        window.setTimeout(() => {
          if (pendingEmitRef.current?.sentAt === sentAt) pendingEmitRef.current = null;
        }, 20000);
      }
    } finally {
      setSending(false);
    }
  }

  // Stores selected files in chat state until upload flow is wired.
  function handleSelectFiles(files) {
    setSelectedFiles((prev) => [...prev, ...files]);
  }

  // Removes one selected file before upload starts.
  function handleRemoveSelectedFile(indexToRemove) {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      <TopHeader
        course={course}
        onSelectCourse={onSelectCourse}
        onCreateClick={onCreateClick}
      />

      <MessagesArea 
        course={course} 
        messages={messages} 
        loading={loading} 
        scrollRef={scrollRef}
        bottomRef={bottomRef} 
        myId={myId}
      />

      <InputArea
        inputValue={inputValue}
        setInputValue={setInputValue}
        handleSend={handleSend}
        sending={sending}
        selectedFiles={selectedFiles}
        onSelectFiles={handleSelectFiles}
        onRemoveSelectedFile={handleRemoveSelectedFile}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        disabled={!courseId}
      />
    </div>
  );
}

function TopHeader({ course, onSelectCourse, onCreateClick }) {
  const { isDark, toggleTheme } = useTheme();
  
  return (
    <div className="border-b border-gray-200 rounded-lg px-6 py-3 overflow-visible relative z-40">
      <div className="flex items-center gap-20 py-1 overflow-visible">
        {/* Left: Course Title */}
        <div className="w-[240px] flex-shrink-0">
          <p
            className="text-sm font-semibold text-gray-900 truncate mb-1"
            title={course?.name}
          >
            {course?.name}
          </p>
          <p className="text-xs text-gray-600 truncate">
            {course?.code}
            {Array.isArray(course?.users) ? ` • ${course.users.length} students` : ""}
          </p>
        </div>

        {/* Right: Search */}
        <div className="flex-1 min-w-0">
          <SearchCourse
            onSelectCourse={onSelectCourse}
            onCreateClick={onCreateClick}
            className="w-full max-w-2xl"
          />
        </div>
      </div>
    </div>
  );
}

// Renders attachment chips; images open in a lightbox, other files download or open in a new tab.
function MessageAttachments({ message, isOwn }) {
  const { notification } = App.useApp();
  const [preview, setPreview] = useState(null);
  const [busyKey, setBusyKey] = useState(null);
  const downloadRetryRef = useRef(null);

  const attachments = message?.attachments;
  if (!Array.isArray(attachments) || attachments.length === 0) return null;

  // Uses kind or MIME so older messages without kind still show as image when appropriate.
  function isImageAttachment(att) {
    if (att?.kind === "image") return true;
    return String(att?.mime || "").startsWith("image/");
  }

  // Fetches presigned URL and opens image modal or file download; stores index for Retry toast.
  async function handleAttachmentClick(index) {
    const att = attachments[index];
    if (!att?.url || !message?._id) return;
    const busy = `${message._id}-${index}`;
    setBusyKey(busy);
    downloadRetryRef.current = { message, index };
    try {
      const data = await presignDownload({
        messageId: message._id,
        attachmentIndex: index,
        courseId: message.courseId,
      });
      const getUrl = data?.getUrl;
      if (!getUrl) throw new Error("Missing download URL");

      if (isImageAttachment(att)) {
        setPreview({ url: getUrl, name: att.name || "Image" });
        return;
      }

      try {
        const res = await fetch(getUrl, { mode: "cors" });
        if (!res.ok) throw new Error("Download failed");
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = att.name || "download";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(objectUrl);
      } catch {
        window.open(getUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      notification.destroy("chat-attachment-dl");
      notification.error({
        key: "chat-attachment-dl",
        message: "Could not open attachment",
        description: String(err?.message || "Unknown error"),
        duration: 0,
        btn: (
          <Button
            type="primary"
            size="small"
            onClick={() => {
              notification.destroy("chat-attachment-dl");
              const snap = downloadRetryRef.current;
              if (snap) void handleAttachmentClick(snap.index);
            }}
          >
            Retry
          </Button>
        ),
      });
    } finally {
      setBusyKey(null);
    }
  }

  const chipBase =
    "inline-flex max-w-full items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50";
  const chipOwn = "border-white/40 bg-white/15 text-white hover:bg-white/25";
  const chipOther = "border-gray-200 bg-white text-gray-800 hover:bg-gray-50";

  return (
    <>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {attachments.map((att, idx) => {
          const image = isImageAttachment(att);
          const label = att.name || (image ? "Image" : "File");
          const loading = busyKey === `${message._id}-${idx}`;
          return (
            <button
              key={`${message._id}-att-${idx}`}
              type="button"
              disabled={loading}
              onClick={() => handleAttachmentClick(idx)}
              className={`${chipBase} ${isOwn ? chipOwn : chipOther}`}
            >
              {image ? (
                <ImageIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              ) : (
                <File className="h-3.5 w-3.5 shrink-0" aria-hidden />
              )}
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>

      {preview ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="relative max-h-[92vh] max-w-[92vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute -right-1 -top-11 rounded-lg bg-white/15 p-2 text-white hover:bg-white/25"
              onClick={() => setPreview(null)}
              aria-label="Close preview"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
            <img
              src={preview.url}
              alt={preview.name}
              className="max-h-[88vh] max-w-full rounded-lg object-contain shadow-2xl"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

function MessagesArea({ course, messages, loading, scrollRef, bottomRef, myId }) {
  const hasMessages = messages.length > 0;
  const showScroll = !loading && hasMessages;
  return (
    <div
      ref={scrollRef}
      className={`flex-1 p-6 space-y-4 transition-opacity ${
        loading ? "opacity-0 overflow-hidden" : "opacity-100"
      } ${showScroll ? "overflow-y-auto" : "overflow-hidden"}`}
    >
      {loading && (
        <div className="h-full flex items-center justify-center text-sm text-gray-500">
          Loading messages...
        </div>
      )}
      {!loading && messages.length === 0 && (
        <div className="h-full flex items-center justify-center text-sm text-gray-500">
          No messages yet.
        </div>
      )}

      {messages.map((message) => {
        const isOwn = String(message?.sender?._id) === String(myId);
        const senderName = message?.sender?.name || "User";
        const initials = senderName
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((w) => w[0].toUpperCase())
          .join("");

        return (
          // wraps ONE full message row (avatar + message bubble)
          <div
            key={message._id || message.id}
            className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
          >
            {/* AVATAR: Displays sender initials with course color */}
            {!isOwn && (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white"
                style={{ backgroundColor: course?.color || "#8B5CF6" }}
              >
                <span className="text-sm">{initials || "U"}</span>
              </div>
            )}

            {/* MESSAGE COLUMN: Holds sender name, message bubble, and timestamp */}
            <div
              className={`flex flex-col ${isOwn ? "items-end pr-4" : "items-start"} max-w-md`}
            >
              {/* SENDER NAME: Displays the sender name */}
              {!isOwn && (
                <span className="text-xs text-gray-600 mb-1 px-1">
                  {senderName}
                </span>
              )}

              {/* MESSAGE BUBBLE: Displays message content and attachments */}
              <div
                className={`px-4 py-3 rounded-2xl ${
                  isOwn
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-900 rounded-bl-sm"
                }`}
              >
                {String(message.content || "").trim() ? (
                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                ) : null}
                <MessageAttachments message={message} isOwn={isOwn} />
              </div>

              {/* TIMESTAMP: Displays the message timestamp */}
              <span className="text-xs text-gray-400 mt-1 px-1">
                {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })
                }
              </span>
            </div>
          </div>
        );
      })}

      <div ref={bottomRef} />
    </div>
  );
}

function InputArea({
  inputValue,
  setInputValue,
  handleSend,
  sending,
  selectedFiles,
  onSelectFiles,
  onRemoveSelectedFile,
  isUploading,
  uploadProgress,
  disabled,
}) {
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  function handleInputKeyDown(e) {
    if (e.key !== "Enter") return;
    if (e.shiftKey) return;
    e.preventDefault();
    handleSend();
  }

  // Appends selected files from hidden file inputs.
  function handleFileInputChange(event) {
    const picked = Array.from(event.target.files || []);
    if (!picked.length) return;
    onSelectFiles?.(picked);
    event.target.value = ""; // clear the input so user can select the same file again
  }

  function resizeTextarea() {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const maxHeight = 72; // 3 lines * 24px line-height
    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }

  useEffect(() => {
    resizeTextarea();
  }, [inputValue]);

  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.style.height = "24px";
      textareaRef.current.style.overflowY = "hidden";
    }
  }, [disabled]);

  return (
    <div className="border-t border-gray-300 p-4">
      {/* Hidden file inputs for file/image pickers */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        onChange={handleFileInputChange}
      />
      <input
        ref={imageInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        multiple
        onChange={handleFileInputChange}
      />

      {/* Selected files preview */}
      {selectedFiles.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {selectedFiles.map((file, idx) => (
            <div
              key={`${file.name}-${file.size}-${idx}`}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
            >
              <span className="max-w-52 truncate font-medium" title={file.name}>{file.name}</span>
              <button
                type="button"
                onClick={() => onRemoveSelectedFile?.(idx)}
                disabled={isUploading}
                className="ml-1 rounded-full p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 disabled:opacity-50"
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload progress placeholder until upload flow is wired */}
      {isUploading && (
        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded bg-gray-200">
            <div
              className="h-full bg-purple-500 transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-3">
        {/* File input */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          disabled={disabled || sending || isUploading}
        >
          <Paperclip className="w-5 h-5 text-gray-500" />
        </button>

        {/* Image input */}
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          disabled={disabled || sending || isUploading}
        >
          <ImageIcon className="w-5 h-5 text-gray-500" />
        </button>

        {/* Textarea */}
        <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 flex items-center gap-2">
          <textarea
            ref={textareaRef}
            placeholder={disabled ? "Select a course to chat..." : "Type a message..."}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onInput={resizeTextarea}
            onKeyDown={handleInputKeyDown}
            rows={1}
            className="flex-1 bg-transparent outline-none text-sm leading-6 text-gray-900 placeholder-gray-500 resize-none"
            disabled={disabled || sending || isUploading}
          />

          {/* Emoji button */}
          <button
            type="button"
            className="hover:scale-110 transition-transform"
            disabled={disabled || sending || isUploading}
          >
            <Smile className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || sending || isUploading || (!inputValue.trim() && selectedFiles.length === 0)}
          className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}