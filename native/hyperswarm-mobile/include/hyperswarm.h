/**
 * Hyperswarm Mobile - C API
 *
 * Native P2P networking for iOS and Android
 */

#ifndef HYPERSWARM_H
#define HYPERSWARM_H

#include <stdint.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

/**
 * Event types
 */
typedef enum {
    HYPERSWARM_EVENT_READY = 0,
    HYPERSWARM_EVENT_PEER_CONNECTED = 1,
    HYPERSWARM_EVENT_PEER_DISCONNECTED = 2,
    HYPERSWARM_EVENT_DATA = 3,
    HYPERSWARM_EVENT_ERROR = 4,
} HyperswarmEventType;

/**
 * Initialize logging (call once at app startup)
 */
void hyperswarm_init_logging(void);

/**
 * Create a new swarm instance
 *
 * @param device_id Unique identifier for this device (null-terminated string)
 * @return Swarm ID on success, 0 on failure
 */
uint64_t hyperswarm_create(const char *device_id);

/**
 * Start the swarm (begin listening for connections)
 *
 * @param swarm_id The swarm ID returned by hyperswarm_create
 * @return 0 on success, -1 on failure
 */
int hyperswarm_start(uint64_t swarm_id);

/**
 * Stop the swarm
 *
 * @param swarm_id The swarm ID
 * @return 0 on success, -1 on failure
 */
int hyperswarm_stop(uint64_t swarm_id);

/**
 * Destroy the swarm and free all resources
 *
 * @param swarm_id The swarm ID
 */
void hyperswarm_destroy(uint64_t swarm_id);

/**
 * Join a topic for peer discovery
 *
 * @param swarm_id The swarm ID
 * @param topic Topic string (will be hashed to 32 bytes)
 * @return 0 on success, -1 on failure
 */
int hyperswarm_join(uint64_t swarm_id, const char *topic);

/**
 * Leave a topic
 *
 * @param swarm_id The swarm ID
 * @param topic Topic string
 * @return 0 on success, -1 on failure
 */
int hyperswarm_leave(uint64_t swarm_id, const char *topic);

/**
 * Send data to a specific peer
 *
 * @param swarm_id The swarm ID
 * @param peer_id Hex-encoded peer ID (64 characters)
 * @param data Pointer to data buffer
 * @param data_len Length of data
 * @return 0 on success, -1 on failure
 */
int hyperswarm_send(uint64_t swarm_id, const char *peer_id,
                    const uint8_t *data, size_t data_len);

/**
 * Broadcast data to all connected peers
 *
 * @param swarm_id The swarm ID
 * @param data Pointer to data buffer
 * @param data_len Length of data
 * @return 0 on success, -1 on failure
 */
int hyperswarm_broadcast(uint64_t swarm_id, const uint8_t *data, size_t data_len);

/**
 * Poll for the next event (non-blocking)
 *
 * @param swarm_id The swarm ID
 * @param out_peer_id Output: peer ID string (caller must free with hyperswarm_free_string)
 * @param out_data Output: data buffer (caller must free with hyperswarm_free_data)
 * @param out_data_len Output: length of data
 * @return Event type, or -1 if no event available
 */
int hyperswarm_poll_event(uint64_t swarm_id, char **out_peer_id,
                          uint8_t **out_data, size_t *out_data_len);

/**
 * Free a string returned by the library
 */
void hyperswarm_free_string(char *s);

/**
 * Free data returned by the library
 */
void hyperswarm_free_data(uint8_t *data);

/**
 * Get the local peer ID
 *
 * @param swarm_id The swarm ID
 * @return Hex-encoded peer ID (caller must free with hyperswarm_free_string)
 */
char *hyperswarm_local_peer_id(uint64_t swarm_id);

/**
 * Get the number of connected peers
 *
 * @param swarm_id The swarm ID
 * @return Number of peers, or -1 on error
 */
int hyperswarm_peer_count(uint64_t swarm_id);

#ifdef __cplusplus
}
#endif

#endif /* HYPERSWARM_H */
