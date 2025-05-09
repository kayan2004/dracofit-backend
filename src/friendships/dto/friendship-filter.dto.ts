export enum FriendshipFilter {
  PENDING_INCOMING = 'pending_incoming', // Add specific incoming
  PENDING_OUTGOING = 'pending_outgoing', // Add specific outgoing
  ACCEPTED = 'accepted',
  ALL = 'all',
  // PENDING = 'pending', // Remove the generic 'pending' if no longer used directly
}
