//! Error types for Hyperswarm Mobile

use thiserror::Error;

#[derive(Error, Debug)]
pub enum Error {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("DHT error: {0}")]
    Dht(String),

    #[error("Noise protocol error: {0}")]
    Noise(String),

    #[error("Connection error: {0}")]
    Connection(String),

    #[error("Peer not found: {0}")]
    PeerNotFound(String),

    #[error("Invalid topic: {0}")]
    InvalidTopic(String),

    #[error("Handshake failed: {0}")]
    HandshakeFailed(String),

    #[error("Send failed: {0}")]
    SendFailed(String),

    #[error("Timeout")]
    Timeout,

    #[error("Already connected")]
    AlreadyConnected,

    #[error("Not connected")]
    NotConnected,

    #[error("Swarm not running")]
    SwarmNotRunning,

    #[error("Invalid state: {0}")]
    InvalidState(String),
}

pub type Result<T> = std::result::Result<T, Error>;

impl From<snow::Error> for Error {
    fn from(err: snow::Error) -> Self {
        Error::Noise(err.to_string())
    }
}
