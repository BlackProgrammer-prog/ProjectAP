// import React, { useState } from 'react';
// import { Dialog, DialogActions, DialogContent, DialogTitle, Button, Accordion, AccordionSummary, AccordionDetails, Typography } from '@mui/material';
// import ExpandMoreIcon from '@mui/icons-material/ExpandMore';


// const Help = ({ open, handleClose }) => {


//     return (
//         <div style={{ position: 'absolute', left: '600px' }}>
//             {/* دیالوگ */}
//             <Dialog open={open} onClose={handleClose} fullWidth>
//                 <DialogTitle>Help & Support</DialogTitle>
//                 <DialogContent>
//                     {/* Accordion ها در داخل دیالوگ */}
//                     <Accordion>
//                         <AccordionSummary expandIcon={<ExpandMoreIcon />}>
//                             <Typography>How to send a message?</Typography>
//                         </AccordionSummary>
//                         <AccordionDetails>
//                             <Typography>
//                                 To send a message, click on the chat with the contact you want to message, type your text and press the send button.
//                             </Typography>
//                         </AccordionDetails>
//                     </Accordion>

//                     <Accordion>
//                         <AccordionSummary expandIcon={<ExpandMoreIcon />}>
//                             <Typography>How to change profile picture?</Typography>
//                         </AccordionSummary>
//                         <AccordionDetails>
//                             <Typography>
//                                 To change your profile picture, go to Settings `{'>'}` Edit Profile `{'>'}` Upload New Photo.
//                             </Typography>
//                         </AccordionDetails>
//                     </Accordion>

//                     <Accordion>
//                         <AccordionSummary expandIcon={<ExpandMoreIcon />}>
//                             <Typography>How to report an issue?</Typography>
//                         </AccordionSummary>
//                         <AccordionDetails>
//                             <Typography>
//                                 If you experience any issues, contact our support team via Settings `{'>'}` Contact Support.
//                             </Typography>
//                         </AccordionDetails>
//                     </Accordion>
//                 </DialogContent>
//                 <DialogActions>
//                     {/* دکمه بستن دیالوگ */}
//                     <Button onClick={handleClose} color="primary">
//                         Close
//                     </Button>
//                 </DialogActions>
//             </Dialog>
//         </div>
//     );
// };

// export default Help;

// ===================================================

import React, { useState } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, Accordion, AccordionSummary, AccordionDetails, Typography, Box } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { InfoCircle } from 'react-feather';  // شما می‌توانید آیکون‌های مناسب خود را وارد کنید

const Help = ({ open, handleClose }) => {

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
            <DialogTitle sx={{p:5}}>Help & Support</DialogTitle>
            <DialogContent>
                {/* Accordion ها در داخل دیالوگ */}
                <Box sx={{ mb: 2 }}>
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1-content" id="panel1-header">
                            <Typography variant="h6">How to send a message?</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography>
                                To send a message, click on the chat with the contact you want to message. Type your text and press the send button.
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                                <img 
                                    src="https://example.com/send_message.png" // آدرس تصویر (تصویر مثال)
                                    alt="How to send a message" 
                                    style={{ width: '100%', borderRadius: 8 }}
                                />
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                </Box>

                <Box sx={{ mb: 2 }}>
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel2-content" id="panel2-header">
                            <Typography variant="h6">How to change profile picture?</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography>
                                To change your profile picture, go to Settings {'>'} Edit Profile {'>'} Upload New Photo.
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                                <img 
                                    src="https://example.com/change_profile.png" // آدرس تصویر (تصویر مثال)
                                    alt="Change profile picture" 
                                    style={{ width: '100%', borderRadius: 8 }}
                                />
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                </Box>

                <Box sx={{ mb: 2 }}>
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel3-content" id="panel3-header">
                            <Typography variant="h6">How to report an issue?</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography>
                                If you experience any issues, contact our support team via Settings {'>'} Contact Support. You can also check our troubleshooting guide.
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                                <img 
                                    src="https://example.com/report_issue.png" // آدرس تصویر (تصویر مثال)
                                    alt="Report issue" 
                                    style={{ width: '100%', borderRadius: 8 }}
                                />
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                </Box>

                {/* شما می‌توانید Accordionهای بیشتری برای سایر سوالات اضافه کنید */}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color="primary" variant="contained">
                    Close
                </Button>
                <Button onClick={handleClose} color="secondary" variant="outlined">
                    Go to Support
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default Help;

