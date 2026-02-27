// Legacy re-export for backward compatibility
// ContextMenu functionality is provided by Menu in coss UI (Base UI)
// Note: This is a simplified re-export. For full context menu functionality,
// the consuming code may need to be updated to use the render prop pattern.

export {
  Menu as ContextMenu,
  MenuTrigger as ContextMenuTrigger,
  MenuPopup as ContextMenuContent,
  MenuItem as ContextMenuItem,
  MenuSeparator as ContextMenuSeparator,
  MenuCheckboxItem as ContextMenuCheckboxItem,
  MenuRadioGroup as ContextMenuRadioGroup,
  MenuRadioItem as ContextMenuRadioItem,
  MenuGroupLabel as ContextMenuLabel,
  MenuShortcut as ContextMenuShortcut,
  MenuGroup as ContextMenuGroup,
  MenuSub as ContextMenuSub,
  MenuSubTrigger as ContextMenuSubTrigger,
  MenuSubPopup as ContextMenuSubContent,
} from './menu';
