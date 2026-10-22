// 稀疏矩阵快速转置 V3: 依据明确标记的合成样例，固定上限，仅编译受信源代码。
// 0-based 下标。以 C++ 原生程序和浏览器 WebAssembly 运行同一核心算法。
// 说明：输入元素会按 A 的行、列升序整理；不接受重复位置及零值三元组。
struct Triple { int r; int c; int value; };
static Triple a[100];
static Triple b[100];
static int used[100];
static int cnum[10];
static int cpot[10];
static int cpotStart[10];
static int rows=0, cols=0, n=0, cursor=0, phase=0;
static int event=0, eventIndex=-1, eventColumn=-1, eventSlot=-1, eventValue=0;
static int steps=0;

extern "C" {
// extern C functions are accessible in the browser WASM runtime and native test executable.
int lab_reset(int r, int c) {
  if(r<1 || r>10 || c<1 || c>10) return -1;
  rows=r; cols=c; n=0; cursor=0; phase=0; event=0; steps=0;
  eventIndex=-1; eventColumn=-1; eventSlot=-1; eventValue=0;
  for(int i=0;i<100;++i) {a[i]={0,0,0};b[i]={0,0,0};used[i]=0;}
  for(int i=0;i<10;++i){cnum[i]=0;cpot[i]=0;cpotStart[i]=0;}
  return 0;
}
int lab_add(int r,int c,int value) {
  if(rows==0||cols==0 || phase!=0 || steps!=0) return -4;
  if(r<0||r>=rows || c<0||c>=cols || value==0) return -1;
  if(n>=100) return -2;
  for(int i=0;i<n;++i) if(a[i].r==r&&a[i].c==c) return -3;
  a[n++] = {r,c,value};
  return n;
}
int lab_prepare(){
  if(rows==0||cols==0 || steps!=0) return -1;
  // Stable insertion sort by original row and column to match PPT's ordered triList.
  for(int i=1;i<n;++i){ Triple v=a[i];int j=i-1;
    while(j>=0 && (a[j].r>v.r||(a[j].r==v.r && a[j].c>v.c))){a[j+1]=a[j];--j;}
    a[j+1]=v;
  }
  phase=0;cursor=0;return n;
}
// Each call executes exactly one algorithmic event: count / prefix / place / done.
int lab_step(){
  while(true){
    if(phase==0){
      if(cursor<n){int idx=cursor++;int column=a[idx].c;
        ++cnum[column]; event=1;eventIndex=idx;eventColumn=column;
        eventSlot=-1;eventValue=a[idx].value; ++steps;return event;}
      phase=1;cursor=0;
    }
    if(phase==1){
      if(cursor<cols){int column=cursor++;
        cpot[column] = column==0 ? 0 : cpot[column-1] + cnum[column-1];
        cpotStart[column]=cpot[column];
        event=2;eventIndex=column;eventColumn=column;eventSlot=cpot[column];eventValue=0;
        ++steps;return event;}
      phase=2;cursor=0;
    }
    if(phase==2){
      if(cursor<n){int idx=cursor++;int column=a[idx].c;
        int slot=cpot[column]++;
        if(slot<0||slot>=n) {phase=3;event=-1;return event;}
        b[slot]={column,a[idx].r,a[idx].value};used[slot]=1;
        event=3;eventIndex=idx;eventColumn=column;eventSlot=slot;eventValue=a[idx].value;
        ++steps;return event;}
      phase=3;
    }
    if(phase==3){event=4;eventIndex=-1;eventColumn=-1;eventSlot=-1;eventValue=0;
      phase=4;++steps;return event;}
    return 0;
  }
}
int lab_rows(){return rows;} int lab_cols(){return cols;} int lab_count(){return n;}
int lab_cursor(){return cursor;} int lab_phase(){return phase;}
int lab_event(){return event;} int lab_event_index(){return eventIndex;}
int lab_event_column(){return eventColumn;} int lab_event_slot(){return eventSlot;}
int lab_event_value(){return eventValue;} int lab_steps(){return steps;}
int lab_a(int index,int field){if(index<0||index>=n||field<0||field>2)return -999999;
 return field==0?a[index].r:field==1?a[index].c:a[index].value;}
int lab_b(int index,int field){if(index<0||index>=n||field<0||field>2)return -999999;
 return field==0?b[index].r:field==1?b[index].c:b[index].value;}
int lab_used(int index){return index>=0&&index<n?used[index]:-1;}
int lab_cnum(int index){return index>=0&&index<cols?cnum[index]:-999999;}
int lab_cpot(int index){return index>=0&&index<cols?cpot[index]:-999999;}
int lab_cpot_start(int index){return index>=0&&index<cols?cpotStart[index]:-999999;}
}
