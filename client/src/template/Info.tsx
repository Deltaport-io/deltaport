import React, { useState } from 'react'
import Modal from 'react-bootstrap/Modal'

export function Info(props: any) {
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <>
      <i className="mdi mdi-information-outline link-primary" style={{cursor: 'pointer'}} onClick={handleShow}></i>
      <Modal show={show} onHide={handleClose} animation={false}>
        <Modal.Header closeButton>Info</Modal.Header>
        <Modal.Body>
          <pre>{ props.data }</pre>
        </Modal.Body>
      </Modal>
    </>
  );
}