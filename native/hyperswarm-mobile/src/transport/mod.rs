//! Transport layer - TCP connections with length-prefixed framing

use crate::{Error, Result};

use std::net::SocketAddr;
use std::sync::Arc;
use tokio::io::{AsyncReadExt, AsyncWriteExt, ReadHalf, WriteHalf};
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::Mutex;

/// Maximum frame size (64KB)
const MAX_FRAME_SIZE: usize = 65536;

/// TCP transport for connections
pub struct Transport {
    listener: Arc<Mutex<Option<TcpListener>>>,
    listen_port: u16,
}

impl Transport {
    /// Create a new transport
    pub fn new(listen_port: u16) -> Result<Self> {
        Ok(Self {
            listener: Arc::new(Mutex::new(None)),
            listen_port,
        })
    }

    /// Start listening and return the local address
    pub async fn start(&self) -> Result<SocketAddr> {
        let addr = format!("0.0.0.0:{}", self.listen_port);
        let listener = TcpListener::bind(&addr).await?;
        let local_addr = listener.local_addr()?;

        *self.listener.lock().await = Some(listener);

        Ok(local_addr)
    }

    /// Accept an incoming connection
    pub async fn accept(&self) -> Result<Connection> {
        let listener = self.listener.lock().await;
        let listener = listener.as_ref().ok_or(Error::NotConnected)?;

        let (stream, addr) = listener.accept().await?;
        stream.set_nodelay(true)?;

        Ok(Connection::new(stream, addr))
    }

    /// Connect to a remote address
    pub async fn connect(&self, addr: SocketAddr) -> Result<Connection> {
        let stream = TcpStream::connect(addr).await?;
        stream.set_nodelay(true)?;
        let remote_addr = stream.peer_addr()?;

        Ok(Connection::new(stream, remote_addr))
    }
}

/// A TCP connection with framing
pub struct Connection {
    reader: Arc<Mutex<ReadHalf<TcpStream>>>,
    writer: Arc<Mutex<WriteHalf<TcpStream>>>,
    remote_addr: SocketAddr,
}

impl Connection {
    fn new(stream: TcpStream, remote_addr: SocketAddr) -> Self {
        let (reader, writer) = tokio::io::split(stream);
        Self {
            reader: Arc::new(Mutex::new(reader)),
            writer: Arc::new(Mutex::new(writer)),
            remote_addr,
        }
    }

    /// Send a framed message
    pub async fn send(&self, data: &[u8]) -> Result<()> {
        if data.len() > MAX_FRAME_SIZE {
            return Err(Error::SendFailed("Message too large".into()));
        }

        let mut writer = self.writer.lock().await;

        // Write length prefix (4 bytes, big endian)
        let len = data.len() as u32;
        writer.write_all(&len.to_be_bytes()).await?;

        // Write data
        writer.write_all(data).await?;
        writer.flush().await?;

        Ok(())
    }

    /// Receive a framed message
    pub async fn recv(&self) -> Result<Vec<u8>> {
        let mut reader = self.reader.lock().await;

        // Read length prefix
        let mut len_buf = [0u8; 4];
        reader.read_exact(&mut len_buf).await?;
        let len = u32::from_be_bytes(len_buf) as usize;

        if len > MAX_FRAME_SIZE {
            return Err(Error::Connection("Frame too large".into()));
        }

        // Read data
        let mut data = vec![0u8; len];
        reader.read_exact(&mut data).await?;

        Ok(data)
    }

    /// Get remote address
    pub fn remote_addr(&self) -> SocketAddr {
        self.remote_addr
    }

    /// Clone the connection (shares underlying stream)
    pub fn clone(&self) -> Self {
        Self {
            reader: self.reader.clone(),
            writer: self.writer.clone(),
            remote_addr: self.remote_addr,
        }
    }
}
