export function getGuildIconUrl(id: string | undefined, icon: string | null | undefined): string {
  if (!id) {
    return 'img:~/assets/icons/xiv.png';
  }
  if (!icon) {
    return '';
  }
  const extension = icon.startsWith('a_') ? 'gif' : 'png';
  return `img:https://cdn.discordapp.com/icons/${id}/${icon}.${extension}?size=128`;
}
