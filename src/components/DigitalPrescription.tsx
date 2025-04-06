import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/components/ui/use-toast";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { FileText, Plus, Trash, Signature } from 'lucide-react';
import { type Prescription, type Medication } from '@/types';

interface DigitalPrescriptionProps {
  patientId: string;
  patientName: string;
  onPrescriptionCreated?: (prescription: Prescription) => void;
}

const DigitalPrescription = ({ patientId, patientName, onPrescriptionCreated }: DigitalPrescriptionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [medications, setMedications] = useState<Medication[]>([{ name: '', dosage: '', frequency: '', duration: '' }]);
  const [instructions, setInstructions] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signatureStarted, setSignatureStarted] = useState(false);

  const handleAddMedication = () => {
    setMedications([...medications, { name: '', dosage: '', frequency: '', duration: '' }]);
  };

  const handleRemoveMedication = (index: number) => {
    const updatedMedications = [...medications];
    updatedMedications.splice(index, 1);
    setMedications(updatedMedications);
  };

  const handleMedicationChange = (index: number, field: keyof Medication, value: string) => {
    const updatedMedications = [...medications];
    updatedMedications[index] = { ...updatedMedications[index], [field]: value };
    setMedications(updatedMedications);
  };

  const handleSignatureStart = () => {
    setSignatureStarted(true);
  };

  const handleDrawStart = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!signatureStarted) return;
    
    setIsDrawing(true);
    const canvas = e.currentTarget;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    }
  };

  const handleDrawMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !signatureStarted) return;
    
    const canvas = e.currentTarget;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#000';
      ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      ctx.stroke();
    }
  };

  const handleDrawEnd = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = e.currentTarget;
      setSignatureData(canvas.toDataURL());
    }
  };

  const handleClearSignature = () => {
    const canvas = document.getElementById('signature-canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setSignatureData(null);
    }
  };

  const validateForm = () => {
    if (!medications[0].name) {
      toast({
        title: "Validation Error",
        description: "Please add at least one medication",
        variant: "destructive",
      });
      return false;
    }

    if (!signatureData) {
      toast({
        title: "Signature Required",
        description: "Please sign the prescription",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const generatePrescriptionPDF = () => {
    if (!validateForm()) return;
    
    // Create PDF document
    const doc = new jsPDF();
    
    // Add hospital/clinic header
    doc.setFontSize(20);
    doc.setTextColor(41, 128, 185);
    doc.text('MediLink Healthcare', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('123 Medical Plaza, Healthcare City', 105, 28, { align: 'center' });
    doc.text('Phone: (123) 456-7890 | Email: care@medilink.com', 105, 35, { align: 'center' });
    
    // Add line separator
    doc.setDrawColor(220, 220, 220);
    doc.line(20, 40, 190, 40);
    
    // Add prescription header
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('PRESCRIPTION', 105, 50, { align: 'center' });
    
    // Add date & Rx number
    const currentDate = new Date().toLocaleDateString();
    const rxNumber = 'RX' + Date.now().toString().slice(-6);
    doc.setFontSize(10);
    doc.text(`Date: ${currentDate}`, 20, 60);
    doc.text(`Rx No: ${rxNumber}`, 170, 60);
    
    // Add patient and doctor info
    doc.setFontSize(12);
    doc.text('Patient Details:', 20, 70);
    doc.setFontSize(11);
    doc.text(`Name: ${patientName}`, 20, 78);
    doc.text(`Patient ID: ${patientId}`, 20, 85);
    
    doc.setFontSize(12);
    doc.text('Prescriber Details:', 120, 70);
    doc.setFontSize(11);
    doc.text(`Name: ${user?.name || 'Doctor'}`, 120, 78);
    doc.text(`License: MD${user?.id || '12345'}`, 120, 85);
    
    // Add line separator
    doc.setDrawColor(220, 220, 220);
    doc.line(20, 95, 190, 95);
    
    // Add medications table
    doc.setFontSize(12);
    doc.text('Rx', 20, 105);
    
    // @ts-ignore - jspdf-autotable types are not fully compatible
    doc.autoTable({
      startY: 110,
      head: [['Medication', 'Dosage', 'Frequency', 'Duration']],
      body: medications.map(med => [
        med.name, 
        med.dosage, 
        med.frequency, 
        med.duration
      ]),
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: { fontSize: 10 },
      margin: { left: 20, right: 20 },
    });
    
    // Add instructions
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text('Instructions:', 20, finalY);
    
    const splitInstructions = doc.splitTextToSize(instructions || 'Take as directed.', 170);
    doc.setFontSize(10);
    doc.text(splitInstructions, 20, finalY + 8);
    
    // Add signature
    if (signatureData) {
      doc.addImage(signatureData, 'PNG', 120, finalY + 30, 60, 20);
      doc.setDrawColor(0);
      doc.line(120, finalY + 55, 180, finalY + 55);
      doc.setFontSize(10);
      doc.text('Doctor\'s Signature', 150, finalY + 62, { align: 'center' });
    }
    
    // Add footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('This is a digital prescription generated via MediLink. Valid for 30 days from date of issue.', 105, pageHeight - 10, { align: 'center' });
    
    // Save PDF
    const pdfOutput = doc.output('datauristring');
    
    // Create prescription object for record keeping
    const newPrescription: Prescription = {
      id: rxNumber,
      patientId,
      patientName,
      doctorId: user?.id || '',
      doctorName: user?.name || '',
      medications,
      instructions,
      createdAt: new Date().toISOString(),
      signatureData: signatureData || undefined,
    };
    
    // Notify parent component
    if (onPrescriptionCreated) {
      onPrescriptionCreated(newPrescription);
    }
    
    toast({
      title: "Prescription Created",
      description: "Prescription has been generated successfully",
    });
    
    // Open PDF in new tab for download
    window.open(pdfOutput, '_blank');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Digital Prescription
        </CardTitle>
        <CardDescription>
          Create a prescription for {patientName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-4">Medications</h3>
            <div className="space-y-4">
              {medications.map((medication, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="grid grid-cols-4 gap-2 flex-1">
                    <div>
                      <Label htmlFor={`med-name-${index}`} className="text-xs mb-1">Medication</Label>
                      <Input
                        id={`med-name-${index}`}
                        value={medication.name}
                        onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                        placeholder="Medication name"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`med-dosage-${index}`} className="text-xs mb-1">Dosage</Label>
                      <Input
                        id={`med-dosage-${index}`}
                        value={medication.dosage}
                        onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                        placeholder="e.g., 500mg"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`med-freq-${index}`} className="text-xs mb-1">Frequency</Label>
                      <Input
                        id={`med-freq-${index}`}
                        value={medication.frequency}
                        onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                        placeholder="e.g., Twice daily"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`med-duration-${index}`} className="text-xs mb-1">Duration</Label>
                      <Input
                        id={`med-duration-${index}`}
                        value={medication.duration}
                        onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                        placeholder="e.g., 7 days"
                      />
                    </div>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="icon"
                    className="mt-5"
                    onClick={() => handleRemoveMedication(index)}
                    disabled={medications.length === 1}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleAddMedication}
              className="mt-2"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Medication
            </Button>
          </div>
          
          <div>
            <Label htmlFor="instructions" className="text-sm font-medium">Instructions</Label>
            <Textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Additional instructions for the patient..."
              rows={3}
              className="mt-1"
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">Doctor's Signature</Label>
              <div className="space-x-2">
                {!signatureStarted ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSignatureStart}
                  >
                    <Signature className="h-4 w-4 mr-1" /> Start Signing
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleClearSignature}
                  >
                    Clear Signature
                  </Button>
                )}
              </div>
            </div>
            <div className="border border-gray-200 rounded-md overflow-hidden">
              <canvas
                id="signature-canvas"
                width={550}
                height={120}
                className={`w-full h-28 ${signatureStarted ? 'cursor-crosshair bg-white' : 'bg-gray-50'}`}
                onMouseDown={handleDrawStart}
                onMouseMove={handleDrawMove}
                onMouseUp={handleDrawEnd}
                onMouseLeave={handleDrawEnd}
              />
            </div>
            {!signatureStarted && !signatureData && (
              <p className="text-xs text-gray-500 mt-1">Click "Start Signing" to add your signature</p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <Button onClick={generatePrescriptionPDF} disabled={!signatureStarted}>
          <FileText className="h-4 w-4 mr-2" />
          Generate Prescription PDF
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DigitalPrescription;
